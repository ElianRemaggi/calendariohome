import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoEvento } from '@prisma/client';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { ValidarEventoDto } from './dto/validar-evento.dto';
import { EventosReglasService } from './eventos-reglas.service';
import { inicioDiaUtc, inicioYFinMes, formatFechaIso, parseFechaLocal } from './utils/fechas.util';

const eventoInclude = {
  tipoEvento: true,
  persona: {
    include: { funcion: true, servicio: true },
  },
} as const;

@Injectable()
export class EventosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reglas: EventosReglasService,
    private readonly authz: AuthorizationService,
  ) {}

  async findByMonth(
    month: string,
    actor: PersonaConRelaciones,
    personaId?: number,
    tipoEventoId?: number,
    servicioId?: number,
    visibleDesde?: string,
    visibleHasta?: string,
    incluirCancelados = false,
  ) {
    const { desde, hasta } =
      visibleDesde && visibleHasta
        ? {
            desde: parseFechaLocal(visibleDesde),
            hasta: parseFechaLocal(visibleHasta),
          }
        : inicioYFinMes(month);
    // @db.Date se lee a medianoche UTC; normalizar para no excluir el primer día del rango.
    const desdeDia = inicioDiaUtc(desde);
    const hastaDia = inicioDiaUtc(hasta);
    const wherePersona = await this.resolvePersonaFilter(
      actor,
      personaId,
      tipoEventoId,
      servicioId,
    );
    let servicioFilter = await this.resolveServicioFilter(
      actor,
      personaId,
      tipoEventoId,
      servicioId,
    );
    if (servicioId && !tipoEventoId && !personaId) {
      servicioFilter = { persona: { servicioId } };
    }

    return this.prisma.evento.findMany({
      where: {
        ...wherePersona,
        ...servicioFilter,
        ...(tipoEventoId && { tipoEventoId }),
        ...(!incluirCancelados && { estado: EstadoEvento.ACTIVO }),
        fechaDesde: { lte: hastaDia },
        fechaHasta: { gte: desdeDia },
      },
      include: eventoInclude,
      orderBy: [{ fechaDesde: 'asc' }, { personaId: 'asc' }],
    });
  }

  private async resolvePersonaFilter(
    actor: PersonaConRelaciones,
    personaId?: number,
    tipoEventoId?: number,
    servicioId?: number,
  ) {
    if (personaId) {
      if (actor.id !== personaId) {
        if (this.authz.isSuperAdmin(actor)) {
          return { personaId };
        }
        if (this.authz.isServiceAdmin(actor)) {
          const persona = await this.prisma.persona.findUnique({
            where: { id: personaId },
            select: { servicioId: true },
          });
          if (
            persona &&
            (await this.authz.canAdminServicio(actor, persona.servicioId))
          ) {
            return { personaId };
          }
        }
        throw new ForbiddenException(
          'No puede consultar eventos de esta persona',
        );
      }
      return { personaId };
    }
    if (servicioId !== undefined && !tipoEventoId) {
      if (this.authz.isSuperAdmin(actor)) {
        return {};
      }
      if (
        this.authz.isServiceAdmin(actor) &&
        (await this.authz.canAdminServicio(actor, servicioId))
      ) {
        return {};
      }
      if (actor.servicioId === servicioId) {
        return {};
      }
      return { personaId: actor.id };
    }
    if (tipoEventoId) {
      if (this.authz.isSuperAdmin(actor)) {
        return {};
      }
      if (this.authz.isServiceAdmin(actor)) {
        const ids = await this.authz.adminServicioIds(actor);
        if (ids.length) {
          return { persona: { servicioId: { in: ids } } };
        }
      }
      // USER: ver equipo del servicio (alcance en resolveServicioFilter)
      return {};
    }
    if (this.authz.isSuperAdmin(actor)) {
      return {};
    }
    return { personaId: actor.id };
  }

  private async resolveServicioFilter(
    actor: PersonaConRelaciones,
    personaId?: number,
    tipoEventoId?: number,
    servicioId?: number,
  ) {
    if (personaId || !tipoEventoId) {
      return {};
    }
    if (servicioId !== undefined) {
      if (
        !this.authz.isSuperAdmin(actor) &&
        !(await this.authz.canAdminServicio(actor, servicioId)) &&
        actor.servicioId !== servicioId
      ) {
        return { persona: { servicioId: actor.servicioId } };
      }
      return { persona: { servicioId } };
    }
    if (this.authz.isSuperAdmin(actor)) {
      return {};
    }
    if (this.authz.isServiceAdmin(actor)) {
      const ids = await this.authz.adminServicioIds(actor);
      if (ids.length === 1) {
        return { persona: { servicioId: ids[0] } };
      }
      if (ids.length > 1) {
        return { persona: { servicioId: { in: ids } } };
      }
    }
    return { persona: { servicioId: actor.servicioId } };
  }

  private eximeVentanaTemporal(actor: PersonaConRelaciones): boolean {
    return this.authz.eximeVentanaTemporal(actor);
  }

  async validar(dto: ValidarEventoDto, actor: PersonaConRelaciones) {
    await this.assertPersonaScope(dto.personaId, actor);
    return this.reglas.validar({
      personaId: dto.personaId,
      tipoEventoId: dto.tipoEventoId,
      fechaDesde: parseFechaLocal(dto.fechaDesde),
      fechaHasta: parseFechaLocal(dto.fechaHasta),
      eventoIdExcluir: dto.eventoId,
      actorEsAdmin: this.eximeVentanaTemporal(actor),
      eximePeriodoBloqueo: this.authz.isAnyAdmin(actor),
    });
  }

  async create(dto: CreateEventoDto, actor: PersonaConRelaciones) {
    const personaId = dto.personaId ?? actor.id;
    await this.assertPersonaScope(personaId, actor);

    const resultado = await this.reglas.validar({
      personaId,
      tipoEventoId: dto.tipoEventoId,
      fechaDesde: parseFechaLocal(dto.fechaDesde),
      fechaHasta: parseFechaLocal(dto.fechaHasta),
      confirmarExcesoCupo: dto.confirmarExcesoCupo ?? false,
      actorEsAdmin: this.eximeVentanaTemporal(actor),
      eximePeriodoBloqueo: this.authz.isAnyAdmin(actor),
    });
    this.assertValidacionParaPersistir(resultado, dto.confirmarExcesoCupo);

    return this.prisma.evento.create({
      data: {
        personaId,
        tipoEventoId: dto.tipoEventoId,
        fechaDesde: parseFechaLocal(dto.fechaDesde),
        fechaHasta: parseFechaLocal(dto.fechaHasta),
        observacion: dto.observacion?.trim() || null,
        excesoCupo: resultado.excesoCupo,
      },
      include: eventoInclude,
    });
  }

  async update(
    id: number,
    dto: UpdateEventoDto,
    actor: PersonaConRelaciones,
  ) {
    const evento = await this.ensureEventoAcceso(id, actor);
    if (evento.estado !== EstadoEvento.ACTIVO) {
      throw new BadRequestException('Solo se pueden editar eventos activos');
    }

    const fechaDesde = dto.fechaDesde
      ? parseFechaLocal(dto.fechaDesde)
      : evento.fechaDesde;
    const fechaHasta = dto.fechaHasta
      ? parseFechaLocal(dto.fechaHasta)
      : evento.fechaHasta;
    const tipoEventoId = dto.tipoEventoId ?? evento.tipoEventoId;

    const resultado = await this.reglas.validar({
      personaId: evento.personaId,
      tipoEventoId,
      fechaDesde,
      fechaHasta,
      eventoIdExcluir: id,
      confirmarExcesoCupo: dto.confirmarExcesoCupo ?? false,
      actorEsAdmin: this.eximeVentanaTemporal(actor),
      eximePeriodoBloqueo: this.authz.isAnyAdmin(actor),
    });
    this.assertValidacionParaPersistir(resultado, dto.confirmarExcesoCupo);

    return this.prisma.evento.update({
      where: { id },
      data: {
        ...(dto.tipoEventoId !== undefined && { tipoEventoId: dto.tipoEventoId }),
        ...(dto.fechaDesde !== undefined && { fechaDesde }),
        ...(dto.fechaHasta !== undefined && { fechaHasta }),
        ...(dto.observacion !== undefined && {
          observacion: dto.observacion.trim() || null,
        }),
        excesoCupo: resultado.excesoCupo,
      },
      include: eventoInclude,
    });
  }

  async cancelar(id: number, actor: PersonaConRelaciones) {
    const evento = await this.ensureEventoAcceso(id, actor);
    if (evento.estado === EstadoEvento.CANCELADO) {
      return evento;
    }

    if (!this.authz.isAnyAdmin(actor)) {
      const desde = inicioDiaUtc(evento.fechaDesde);
      const hasta = inicioDiaUtc(evento.fechaHasta);
      const bloqueo = await this.prisma.periodoBloqueo.findFirst({
        where: {
          activo: true,
          servicioId: evento.persona.servicioId,
          tipoEventoId: evento.tipoEventoId,
          fechaDesde: { lte: hasta },
          fechaHasta: { gte: desde },
        },
      });
      if (bloqueo) {
        throw new BadRequestException({
          message: `El período ${formatFechaIso(bloqueo.fechaDesde)}–${formatFechaIso(bloqueo.fechaHasta)} está cerrado para esta novedad. Solo un administrador puede modificarlo.`,
          errores: [
            {
              codigo: 'PERIODO_CERRADO',
              mensaje: `El período ${formatFechaIso(bloqueo.fechaDesde)}–${formatFechaIso(bloqueo.fechaHasta)} está cerrado para esta novedad. Solo un administrador puede modificarlo.`,
            },
          ],
        });
      }
    }

    return this.prisma.evento.update({
      where: { id },
      data: {
        estado: EstadoEvento.CANCELADO,
        canceladoEn: new Date(),
      },
      include: eventoInclude,
    });
  }

  private async assertPersonaScope(
    personaId: number,
    actor: PersonaConRelaciones,
  ) {
    if (!(await this.authz.canActOnPersona(actor, personaId))) {
      throw new ForbiddenException('No puede operar sobre esta persona');
    }
  }

  private assertValidacionParaPersistir(
    resultado: Awaited<ReturnType<EventosReglasService['validar']>>,
    confirmarExcesoCupo?: boolean,
  ) {
    if (!resultado.permitido) {
      throw new BadRequestException({
        message: 'No se puede crear o modificar el evento',
        errores: resultado.errores,
      });
    }
    if (
      resultado.advertencias.length > 0 &&
      !confirmarExcesoCupo
    ) {
      throw new BadRequestException({
        message: 'Confirmación requerida por exceso de cupo',
        advertencias: resultado.advertencias,
        codigo: 'EXCESO_CUPO',
      });
    }
  }

  private async ensureEventoAcceso(id: number, actor: PersonaConRelaciones) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: eventoInclude,
    });
    if (!evento) {
      throw new NotFoundException(`Evento ${id} no encontrado`);
    }
    if (!(await this.authz.canActOnPersona(actor, evento.personaId))) {
      throw new ForbiddenException('No puede modificar eventos de otra persona');
    }
    return evento;
  }
}
