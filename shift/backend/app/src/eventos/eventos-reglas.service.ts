import { Injectable } from '@nestjs/common';
import { EstadoEvento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CODIGO_CUPO_LLENO,
  CODIGO_EXCESO_CUPO,
  CODIGO_FERIADO,
  CODIGO_FIN_DE_SEMANA,
  CODIGO_ANTICIPACION_MINIMA,
  CODIGO_MES_ANTERIOR_NO_PERMITIDO,
  CODIGO_MES_POSTERIOR_NO_PERMITIDO,
  CODIGO_PERIODO_CERRADO,
  CODIGO_RANGO_NO_PERMITIDO,
  CODIGO_UN_EVENTO_POR_DIA,
  CODIGO_RANGO_MAX_DIAS,
  CODIGO_RANGO_MIN_DIAS,
  ReglaMensaje,
  ValidacionEventoInput,
  ValidacionEventoResultado,
} from './eventos-reglas.types';
import {
  TipoEventoConfigEfectiva,
  TipoEventoConfigService,
} from './tipo-evento-config.service';
import {
  cadaDiaEnRango,
  esFinDeSemana,
  formatFechaIso,
  inicioDiaUtc,
  mesActualArgentina,
  mesesEntre,
  todayIsoArgentina,
  monthKeyFromDate,
} from './utils/fechas.util';

const MSG_EXCESO_CUPO =
  'El cupo máximo recomendado para este día fue alcanzado. Puede anotarse igualmente, pero el evento quedará marcado como exceso de cupo.';

@Injectable()
export class EventosReglasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tipoConfig: TipoEventoConfigService,
  ) {}

  async validar(input: ValidacionEventoInput): Promise<ValidacionEventoResultado> {
    const errores: ReglaMensaje[] = [];
    const advertencias: ReglaMensaje[] = [];
    let excesoCupo = false;

    const persona = await this.prisma.persona.findUnique({
      where: { id: input.personaId },
      select: { servicioId: true, activo: true },
    });
    if (!persona?.activo) {
      errores.push({
        codigo: 'PERSONA_INVALIDA',
        mensaje: 'Persona no encontrada o inactiva',
      });
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    let tipo: TipoEventoConfigEfectiva;
    try {
      tipo = await this.tipoConfig.resolve(
        input.tipoEventoId,
        persona.servicioId,
      );
    } catch {
      errores.push({
        codigo: 'TIPO_EVENTO_INVALIDO',
        mensaje: 'Tipo de evento no encontrado o inactivo',
      });
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    if (!tipo.activo) {
      errores.push({
        codigo: 'TIPO_EVENTO_INVALIDO',
        mensaje: 'Tipo de evento no encontrado o inactivo',
      });
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    if (input.fechaDesde > input.fechaHasta) {
      errores.push({
        codigo: 'FECHAS_INVALIDAS',
        mensaje: 'fechaDesde no puede ser posterior a fechaHasta',
      });
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    this.validarModalidadCarga(tipo, input, errores);
    if (errores.length > 0) {
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    const dias = cadaDiaEnRango(input.fechaDesde, input.fechaHasta);

    this.validarDiasRango(tipo, dias.length, errores);
    if (errores.length > 0) {
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    if (!input.eximePeriodoBloqueo) {
      await this.validarPeriodoBloqueo(
        persona.servicioId,
        input.tipoEventoId,
        input.fechaDesde,
        input.fechaHasta,
        errores,
      );
      if (errores.length > 0) {
        return { permitido: false, errores, advertencias, excesoCupo };
      }
    }

    const feriados = await this.cargarFeriadosActivos(dias, persona.servicioId);
    const mesActual = mesActualArgentina();
    const hoy = todayIsoArgentina();

    for (const dia of dias) {
      const fechaStr = formatFechaIso(dia);

      if (!input.actorEsAdmin) {
        if (fechaStr <= hoy) {
          errores.push({
            codigo: CODIGO_ANTICIPACION_MINIMA,
            mensaje:
              'Debés anotarte con al menos un día de anticipación. No se puede cargar el día de hoy ni fechas pasadas.',
            fecha: fechaStr,
          });
          continue;
        }
        const offset = mesesEntre(monthKeyFromDate(dia), mesActual);
        if (offset < tipo.mesMinOffsetUser) {
          errores.push({
            codigo: CODIGO_MES_ANTERIOR_NO_PERMITIDO,
            mensaje: `Este tipo de evento no permite cargar en meses anteriores al permitido (${tipo.nombre})`,
            fecha: fechaStr,
          });
          continue;
        }
        if (
          tipo.mesMaxOffsetUser !== null &&
          tipo.mesMaxOffsetUser !== undefined &&
          offset > tipo.mesMaxOffsetUser
        ) {
          errores.push({
            codigo: CODIGO_MES_POSTERIOR_NO_PERMITIDO,
            mensaje: `Este tipo de evento no permite cargar tan adelante en el calendario (${tipo.nombre})`,
            fecha: fechaStr,
          });
          continue;
        }
      }

      if (tipo.bloqueaFinDeSemana && esFinDeSemana(dia)) {
        errores.push({
          codigo: CODIGO_FIN_DE_SEMANA,
          mensaje: `No se pueden cargar eventos de este tipo en fin de semana (${fechaStr})`,
          fecha: fechaStr,
        });
        continue;
      }

      if (tipo.bloqueaFeriado && feriados.has(fechaStr)) {
        errores.push({
          codigo: CODIGO_FERIADO,
          mensaje: `El día ${fechaStr} es feriado y este tipo de evento no admite carga`,
          fecha: fechaStr,
        });
        continue;
      }

      const ocupado = await this.personaTieneEventoActivoEnDia(
        input.personaId,
        dia,
        input.eventoIdExcluir,
      );
      if (ocupado) {
        errores.push({
          codigo: CODIGO_UN_EVENTO_POR_DIA,
          mensaje: `Ya tiene un evento activo el día ${fechaStr}`,
          fecha: fechaStr,
        });
      }

      const cupo = await this.evaluarCupoDia(
        tipo,
        dia,
        persona.servicioId,
        input.eventoIdExcluir,
      );
      if (cupo.error) {
        errores.push({ ...cupo.error, fecha: fechaStr });
      } else if (cupo.advertencia) {
        advertencias.push({ ...cupo.advertencia, fecha: fechaStr });
        excesoCupo = true;
      }
    }

    if (errores.length > 0) {
      return { permitido: false, errores, advertencias, excesoCupo };
    }

    if (excesoCupo && !tipo.permiteExcesoCupo) {
      return {
        permitido: false,
        errores: advertencias.map((a) => ({
          codigo: CODIGO_CUPO_LLENO,
          mensaje: a.mensaje,
          fecha: a.fecha,
        })),
        advertencias: [],
        excesoCupo,
      };
    }

    if (excesoCupo && tipo.permiteExcesoCupo && !input.confirmarExcesoCupo) {
      return { permitido: true, errores: [], advertencias, excesoCupo };
    }

    return {
      permitido: true,
      errores: [],
      advertencias: input.confirmarExcesoCupo ? [] : advertencias,
      excesoCupo: excesoCupo && !!input.confirmarExcesoCupo,
    };
  }

  private async validarPeriodoBloqueo(
    servicioId: number,
    tipoEventoId: number,
    fechaDesde: Date,
    fechaHasta: Date,
    errores: ReglaMensaje[],
  ) {
    const desde = inicioDiaUtc(fechaDesde);
    const hasta = inicioDiaUtc(fechaHasta);
    const bloqueo = await this.prisma.periodoBloqueo.findFirst({
      where: {
        activo: true,
        servicioId,
        tipoEventoId,
        fechaDesde: { lte: hasta },
        fechaHasta: { gte: desde },
      },
      orderBy: { fechaDesde: 'asc' },
    });
    if (!bloqueo) {
      return;
    }
    errores.push({
      codigo: CODIGO_PERIODO_CERRADO,
      mensaje: `El período ${formatFechaIso(bloqueo.fechaDesde)}–${formatFechaIso(bloqueo.fechaHasta)} está cerrado para esta novedad. Solo un administrador puede modificarlo.`,
    });
  }

  private validarModalidadCarga(
    tipo: TipoEventoConfigEfectiva,
    input: ValidacionEventoInput,
    errores: ReglaMensaje[],
  ) {
    const mismoDia =
      formatFechaIso(input.fechaDesde) === formatFechaIso(input.fechaHasta);
    if (!tipo.permiteCargaPorRango && !mismoDia) {
      errores.push({
        codigo: CODIGO_RANGO_NO_PERMITIDO,
        mensaje:
          'Este tipo de evento solo permite carga de un día (fechaDesde = fechaHasta)',
      });
    }
  }

  private async cargarFeriadosActivos(
    dias: Date[],
    servicioId: number,
  ): Promise<Set<string>> {
    if (dias.length === 0) {
      return new Set();
    }
    const min = dias[0];
    const max = dias[dias.length - 1];
    const rows = await this.prisma.feriado.findMany({
      where: {
        activo: true,
        fecha: { gte: min, lte: max },
        OR: [{ servicioId: null }, { servicioId }],
      },
    });
    return new Set(rows.map((f) => formatFechaIso(f.fecha)));
  }

  private async personaTieneEventoActivoEnDia(
    personaId: number,
    dia: Date,
    excluirId?: number,
  ): Promise<boolean> {
    const count = await this.prisma.evento.count({
      where: {
        personaId,
        estado: EstadoEvento.ACTIVO,
        id: excluirId ? { not: excluirId } : undefined,
        fechaDesde: { lte: dia },
        fechaHasta: { gte: dia },
      },
    });
    return count > 0;
  }

  private async evaluarCupoDia(
    tipo: TipoEventoConfigEfectiva,
    dia: Date,
    servicioId: number,
    excluirId?: number,
  ): Promise<{ error?: ReglaMensaje; advertencia?: ReglaMensaje }> {
    if (!tipo.requiereCupo) {
      return {};
    }

    const ocupados = await this.prisma.evento.count({
      where: {
        tipoEventoId: tipo.id,
        estado: EstadoEvento.ACTIVO,
        id: excluirId ? { not: excluirId } : undefined,
        fechaDesde: { lte: dia },
        fechaHasta: { gte: dia },
        persona: { servicioId },
      },
    });

    if (ocupados < tipo.cupoDiario) {
      return {};
    }

    if (tipo.permiteExcesoCupo) {
      return {
        advertencia: {
          codigo: CODIGO_EXCESO_CUPO,
          mensaje: MSG_EXCESO_CUPO,
        },
      };
    }

    return {
      error: {
        codigo: CODIGO_CUPO_LLENO,
        mensaje: `Cupo diario alcanzado (${tipo.cupoDiario} personas)`,
      },
    };
  }

  private validarDiasRango(
    tipo: TipoEventoConfigEfectiva,
    diasCorridos: number,
    errores: ReglaMensaje[],
  ) {
    if (!tipo.permiteCargaPorRango) {
      return;
    }
    const nombre = tipo.nombre;
    if (
      tipo.minDiasRango !== null &&
      tipo.minDiasRango !== undefined &&
      diasCorridos < tipo.minDiasRango
    ) {
      errores.push({
        codigo: CODIGO_RANGO_MIN_DIAS,
        mensaje: `${nombre} requiere al menos ${tipo.minDiasRango} días corridos (el rango tiene ${diasCorridos} días)`,
      });
    }
    if (
      tipo.maxDiasRango !== null &&
      tipo.maxDiasRango !== undefined &&
      diasCorridos > tipo.maxDiasRango
    ) {
      errores.push({
        codigo: CODIGO_RANGO_MAX_DIAS,
        mensaje: `${nombre} no puede superar ${tipo.maxDiasRango} días corridos (el rango tiene ${diasCorridos} días)`,
      });
    }
  }
}
