import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Config efectiva de reglas para un tipo en un servicio (base + override). */
export type TipoEventoConfigEfectiva = {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
  requiereCupo: boolean;
  cupoDiario: number;
  permiteExcesoCupo: boolean;
  permiteCargaPorRango: boolean;
  bloqueaFinDeSemana: boolean;
  bloqueaFeriado: boolean;
  requiereAprobacion: boolean;
  mesMinOffsetUser: number;
  mesMaxOffsetUser: number | null;
  minDiasRango: number | null;
  maxDiasRango: number | null;
};

@Injectable()
export class TipoEventoConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    tipoEventoId: number,
    servicioId: number,
  ): Promise<TipoEventoConfigEfectiva> {
    const tipo = await this.prisma.tipoEvento.findUnique({
      where: { id: tipoEventoId },
    });
    if (!tipo) {
      throw new NotFoundException(`Tipo de evento ${tipoEventoId} no encontrado`);
    }

    const override = await this.prisma.servicioTipoEvento.findUnique({
      where: {
        servicioId_tipoEventoId: { servicioId, tipoEventoId },
      },
    });

    if (!override?.usaOverride) {
      return { ...tipo };
    }

    return {
      ...tipo,
      requiereCupo: override.requiereCupo ?? tipo.requiereCupo,
      cupoDiario: override.cupoDiario ?? tipo.cupoDiario,
      permiteExcesoCupo: override.permiteExcesoCupo ?? tipo.permiteExcesoCupo,
      permiteCargaPorRango:
        override.permiteCargaPorRango ?? tipo.permiteCargaPorRango,
      bloqueaFinDeSemana: override.bloqueaFinDeSemana ?? tipo.bloqueaFinDeSemana,
      bloqueaFeriado: override.bloqueaFeriado ?? tipo.bloqueaFeriado,
      requiereAprobacion: override.requiereAprobacion ?? tipo.requiereAprobacion,
      mesMinOffsetUser: override.mesMinOffsetUser ?? tipo.mesMinOffsetUser,
      mesMaxOffsetUser:
        override.mesMaxOffsetUser !== undefined && override.mesMaxOffsetUser !== null
          ? override.mesMaxOffsetUser
          : tipo.mesMaxOffsetUser,
      minDiasRango: override.minDiasRango ?? tipo.minDiasRango,
      maxDiasRango: override.maxDiasRango ?? tipo.maxDiasRango,
    };
  }
}
