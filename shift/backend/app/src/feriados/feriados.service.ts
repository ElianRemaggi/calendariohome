import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import { parseFechaLocal } from '../eventos/utils/fechas.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeriadoDto } from './dto/create-feriado.dto';
import { UpdateFeriadoDto } from './dto/update-feriado.dto';

@Injectable()
export class FeriadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
  ) {}

  findAll(year?: number, servicioId?: number) {
    const fechaFilter =
      year === undefined
        ? undefined
        : {
            fecha: {
              gte: parseFechaLocal(`${year}-01-01`),
              lte: parseFechaLocal(`${year}-12-31`),
            },
          };

    const servicioFilter =
      servicioId === undefined
        ? undefined
        : {
            OR: [{ servicioId: null }, { servicioId }],
          };

    return this.prisma.feriado.findMany({
      where: {
        ...fechaFilter,
        ...servicioFilter,
      },
      orderBy: { fecha: 'asc' },
    });
  }

  async create(dto: CreateFeriadoDto, actor: PersonaConRelaciones) {
    const servicioId = dto.servicioId ?? null;
    if (servicioId === null) {
      if (!this.authz.isSuperAdmin(actor)) {
        throw new ForbiddenException(
          'Solo SUPER_ADMIN puede crear feriados base',
        );
      }
    } else {
      await this.authz.assertCanAdminServicio(actor, servicioId);
    }

    const fecha = parseFechaLocal(dto.fecha);
    try {
      return await this.prisma.feriado.create({
        data: {
          fecha,
          descripcion: dto.descripcion?.trim() ?? '',
          servicioId,
        },
      });
    } catch {
      throw new ConflictException(
        'Ya existe un feriado para esa fecha en el mismo ámbito',
      );
    }
  }

  async update(
    id: number,
    dto: UpdateFeriadoDto,
    actor: PersonaConRelaciones,
  ) {
    const row = await this.ensureExists(id);
    if (row.servicioId === null) {
      if (!this.authz.isSuperAdmin(actor)) {
        throw new ForbiddenException('No puede editar feriados base');
      }
    } else {
      await this.authz.assertCanAdminServicio(actor, row.servicioId);
    }

    return this.prisma.feriado.update({
      where: { id },
      data: {
        ...(dto.descripcion !== undefined && {
          descripcion: dto.descripcion.trim(),
        }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.feriado.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Feriado ${id} no encontrado`);
    }
    return row;
  }
}
