import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertCanDeactivate } from '../common/catalog-dependency';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';
import { UpdateTipoEventoDto } from './dto/update-tipo-evento.dto';

@Injectable()
export class TiposEventoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(activo?: boolean) {
    return this.prisma.tipoEvento.findMany({
      where: activo === undefined ? undefined : { activo },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { eventos: true } } },
    });
  }

  async create(dto: CreateTipoEventoDto) {
    const permiteRango = dto.permiteCargaPorRango ?? false;
    const { minDiasRango, maxDiasRango } = this.normalizarDiasRango(
      permiteRango,
      dto.minDiasRango,
      dto.maxDiasRango,
    );
    try {
      return await this.prisma.tipoEvento.create({
        data: {
          nombre: dto.nombre.trim(),
          codigo: dto.codigo.trim().toUpperCase(),
          activo: dto.activo ?? true,
          requiereCupo: dto.requiereCupo ?? true,
          cupoDiario: dto.cupoDiario ?? 3,
          permiteExcesoCupo: dto.permiteExcesoCupo ?? false,
          permiteCargaPorRango: permiteRango,
          bloqueaFinDeSemana: dto.bloqueaFinDeSemana ?? true,
          bloqueaFeriado: dto.bloqueaFeriado ?? true,
          requiereAprobacion: dto.requiereAprobacion ?? false,
          mesMinOffsetUser: dto.mesMinOffsetUser ?? 0,
          mesMaxOffsetUser: dto.mesMaxOffsetUser ?? null,
          minDiasRango,
          maxDiasRango,
        },
        include: { _count: { select: { eventos: true } } },
      });
    } catch {
      throw new ConflictException('Ya existe un tipo de evento con ese código');
    }
  }

  async update(id: number, dto: UpdateTipoEventoDto) {
    const existing = await this.ensureExists(id);
    if (dto.activo === false) {
      const count = await this.prisma.evento.count({ where: { tipoEventoId: id } });
      assertCanDeactivate('el tipo de evento', count, 'evento');
    }
    const permiteRango =
      dto.permiteCargaPorRango !== undefined
        ? dto.permiteCargaPorRango
        : existing.permiteCargaPorRango;
    const minIn =
      dto.minDiasRango !== undefined ? dto.minDiasRango : existing.minDiasRango;
    const maxIn =
      dto.maxDiasRango !== undefined ? dto.maxDiasRango : existing.maxDiasRango;
    const { minDiasRango, maxDiasRango } = this.normalizarDiasRango(
      permiteRango,
      minIn,
      maxIn,
    );
    try {
      return await this.prisma.tipoEvento.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.codigo !== undefined && {
            codigo: dto.codigo.trim().toUpperCase(),
          }),
          ...(dto.activo !== undefined && { activo: dto.activo }),
          ...(dto.requiereCupo !== undefined && { requiereCupo: dto.requiereCupo }),
          ...(dto.cupoDiario !== undefined && { cupoDiario: dto.cupoDiario }),
          ...(dto.permiteExcesoCupo !== undefined && {
            permiteExcesoCupo: dto.permiteExcesoCupo,
          }),
          ...(dto.permiteCargaPorRango !== undefined && {
            permiteCargaPorRango: dto.permiteCargaPorRango,
          }),
          ...(dto.bloqueaFinDeSemana !== undefined && {
            bloqueaFinDeSemana: dto.bloqueaFinDeSemana,
          }),
          ...(dto.bloqueaFeriado !== undefined && {
            bloqueaFeriado: dto.bloqueaFeriado,
          }),
          ...(dto.requiereAprobacion !== undefined && {
            requiereAprobacion: dto.requiereAprobacion,
          }),
          ...(dto.mesMinOffsetUser !== undefined && {
            mesMinOffsetUser: dto.mesMinOffsetUser,
          }),
          ...(dto.mesMaxOffsetUser !== undefined && {
            mesMaxOffsetUser: dto.mesMaxOffsetUser,
          }),
          ...(dto.permiteCargaPorRango !== undefined ||
          dto.minDiasRango !== undefined ||
          dto.maxDiasRango !== undefined
            ? { minDiasRango, maxDiasRango }
            : {}),
        },
        include: { _count: { select: { eventos: true } } },
      });
    } catch {
      throw new ConflictException('Ya existe un tipo de evento con ese código');
    }
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.tipoEvento.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Tipo de evento ${id} no encontrado`);
    }
    return row;
  }

  private normalizarDiasRango(
    permiteCargaPorRango: boolean,
    minIn?: number | null,
    maxIn?: number | null,
  ): { minDiasRango: number | null; maxDiasRango: number | null } {
    if (!permiteCargaPorRango) {
      return { minDiasRango: null, maxDiasRango: null };
    }
    const minDiasRango = minIn ?? null;
    const maxDiasRango = maxIn ?? null;
    if (
      minDiasRango !== null &&
      maxDiasRango !== null &&
      minDiasRango > maxDiasRango
    ) {
      throw new BadRequestException(
        'El mínimo de días por pedido no puede ser mayor que el máximo',
      );
    }
    return { minDiasRango, maxDiasRango };
  }
}
