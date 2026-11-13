import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import { assertCanDeactivate } from '../common/catalog-dependency';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionDto } from './dto/create-funcion.dto';
import { UpdateFuncionDto } from './dto/update-funcion.dto';

@Injectable()
export class FuncionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
  ) {}

  findForServicio(servicioId: number, activo?: boolean) {
    return this.prisma.funcion.findMany({
      where: {
        ...(activo === undefined ? {} : { activo }),
        OR: [{ servicioId: null }, { servicioId }],
      },
      orderBy: [{ servicioId: 'asc' }, { nombre: 'asc' }],
      include: { _count: { select: { personas: true } } },
    });
  }

  findAll(activo?: boolean, actor?: PersonaConRelaciones) {
    if (actor && this.authz.isServiceAdmin(actor) && !this.authz.isSuperAdmin(actor)) {
      throw new ForbiddenException('Use GET /funciones?servicioId=');
    }
    return this.prisma.funcion.findMany({
      where: activo === undefined ? undefined : { activo },
      orderBy: [{ servicioId: 'asc' }, { nombre: 'asc' }],
      include: { _count: { select: { personas: true } } },
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.funcion.findUnique({
      where: { id },
      include: {
        _count: { select: { personas: true } },
        personas: {
          orderBy: { nombre: 'asc' },
          select: {
            id: true,
            legajo: true,
            nombre: true,
            activo: true,
            servicio: { select: { id: true, nombre: true } },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(`Función ${id} no encontrada`);
    }
    return row;
  }

  async create(dto: CreateFuncionDto, actor: PersonaConRelaciones) {
    const servicioId = dto.servicioId ?? null;
    if (servicioId === null) {
      if (!this.authz.isSuperAdmin(actor)) {
        throw new ForbiddenException('Solo SUPER_ADMIN puede crear funciones globales');
      }
    } else {
      await this.authz.assertCanAdminServicio(actor, servicioId);
    }

    try {
      return await this.prisma.funcion.create({
        data: {
          nombre: dto.nombre.trim(),
          activo: dto.activo ?? true,
          servicioId,
        },
        include: { _count: { select: { personas: true } } },
      });
    } catch {
      throw new ConflictException('Ya existe una función con ese nombre en el ámbito');
    }
  }

  async update(
    id: number,
    dto: UpdateFuncionDto,
    actor: PersonaConRelaciones,
  ) {
    const row = await this.ensureExists(id);
    await this.assertCanEditFuncion(actor, row.servicioId);

    if (dto.activo === false) {
      const count = await this.prisma.persona.count({ where: { funcionId: id } });
      assertCanDeactivate('la función', count, 'empleado');
    }
    try {
      return await this.prisma.funcion.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.activo !== undefined && { activo: dto.activo }),
        },
        include: { _count: { select: { personas: true } } },
      });
    } catch {
      throw new ConflictException('Ya existe una función con ese nombre en el ámbito');
    }
  }

  private async assertCanEditFuncion(
    actor: PersonaConRelaciones,
    servicioId: number | null,
  ) {
    if (servicioId === null) {
      if (!this.authz.isSuperAdmin(actor)) {
        throw new ForbiddenException('No puede editar funciones globales');
      }
      return;
    }
    await this.authz.assertCanAdminServicio(actor, servicioId);
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.funcion.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Función ${id} no encontrada`);
    }
    return row;
  }
}
