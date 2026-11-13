import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { assertCanDeactivate } from '../common/catalog-dependency';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import { TipoEventoConfigService } from '../eventos/tipo-evento-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { UpdateServicioTipoEventoDto } from './dto/update-servicio-tipo-evento.dto';

const personaActiva = { activo: true } as const;

const personaEnServicio = {
  where: personaActiva,
  orderBy: { nombre: 'asc' as const },
  include: { funcion: true },
};

const countPersonasActivas = {
  select: { personas: { where: personaActiva } },
} as const;

@Injectable()
export class ServiciosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
    private readonly tipoConfig: TipoEventoConfigService,
  ) {}

  async findAll(activo?: boolean, actor?: PersonaConRelaciones) {
    if (!actor) {
      return this.prisma.servicio.findMany({
        where: activo === undefined ? { activo: true } : { activo },
        orderBy: { nombre: 'asc' },
        include: { _count: countPersonasActivas },
      });
    }
    if (!this.authz.isSuperAdmin(actor)) {
      if (this.authz.isServiceAdmin(actor)) {
        const ids = await this.authz.adminServicioIds(actor);
        return this.prisma.servicio.findMany({
          where: {
            id: { in: ids },
            ...(activo === undefined ? {} : { activo }),
          },
          orderBy: { nombre: 'asc' },
          include: { _count: countPersonasActivas },
        });
      }
      return this.prisma.servicio.findMany({
        where: {
          id: actor.servicioId,
          ...(activo === undefined ? {} : { activo }),
        },
        orderBy: { nombre: 'asc' },
        include: { _count: countPersonasActivas },
      });
    }
    return this.prisma.servicio.findMany({
      where: activo === undefined ? undefined : { activo },
      orderBy: { nombre: 'asc' },
      include: { _count: countPersonasActivas },
    });
  }

  async findOne(id: number, actor?: PersonaConRelaciones) {
    if (actor && !this.authz.isSuperAdmin(actor)) {
      if (this.authz.isServiceAdmin(actor)) {
        await this.authz.assertCanAdminServicio(actor, id);
      } else if (actor.servicioId !== id) {
        throw new ForbiddenException('Sin permiso sobre este servicio');
      }
    }
    const row = await this.prisma.servicio.findUnique({
      where: { id },
      include: {
        _count: countPersonasActivas,
        personas: {
          orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
          include: { funcion: true },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(`Servicio ${id} no encontrado`);
    }
    const personasActivas = row.personas.filter((p) => p.activo).length;
    return { ...row, personasActivas };
  }

  create(dto: CreateServicioDto) {
    return this.prisma.servicio.create({
      data: { nombre: dto.nombre.trim(), activo: dto.activo ?? true },
      include: { _count: countPersonasActivas },
    });
  }

  async update(id: number, dto: UpdateServicioDto) {
    await this.ensureExists(id);
    if (dto.activo === false) {
      const count = await this.prisma.persona.count({
        where: { servicioId: id, activo: true },
      });
      assertCanDeactivate('el servicio', count, 'empleado activo');
    }
    try {
      return await this.prisma.servicio.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.activo !== undefined && { activo: dto.activo }),
        },
        include: { _count: countPersonasActivas },
      });
    } catch {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }
  }

  async remove(id: number) {
    await this.ensureExists(id);
    const [personas, comentarios] = await Promise.all([
      this.prisma.persona.count({ where: { servicioId: id } }),
      this.prisma.comentarioMes.count({ where: { servicioId: id } }),
    ]);
    if (personas > 0) {
      throw new ConflictException(
        'No se puede eliminar el servicio: hay empleados asignados. Reasignelos a otro servicio o elimínelos antes.',
      );
    }
    if (comentarios > 0) {
      throw new BadRequestException(
        'No se puede eliminar: tiene comentarios del mes guardados. Desactivá el servicio en su lugar.',
      );
    }
    await this.prisma.servicio.delete({ where: { id } });
    return { ok: true };
  }

  async listTiposEventoConfig(servicioId: number, actor: PersonaConRelaciones) {
    await this.authz.assertCanAdminServicio(actor, servicioId);
    const tipos = await this.prisma.tipoEvento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    const overrides = await this.prisma.servicioTipoEvento.findMany({
      where: { servicioId },
    });
    const byTipo = new Map(overrides.map((o) => [o.tipoEventoId, o]));

    return Promise.all(
      tipos.map(async (tipo) => {
        const override = byTipo.get(tipo.id);
        const efectiva = await this.tipoConfig.resolve(tipo.id, servicioId);
        return {
          tipoEvento: tipo,
          override: override ?? null,
          efectiva,
        };
      }),
    );
  }

  async updateTipoEventoConfig(
    servicioId: number,
    tipoEventoId: number,
    dto: UpdateServicioTipoEventoDto,
    actor: PersonaConRelaciones,
  ) {
    await this.authz.assertCanAdminServicio(actor, servicioId);
    const tipo = await this.prisma.tipoEvento.findUnique({
      where: { id: tipoEventoId },
    });
    if (!tipo) {
      throw new NotFoundException(`Tipo de evento ${tipoEventoId} no encontrado`);
    }

    const data = {
      usaOverride: dto.usaOverride ?? true,
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
      ...(dto.minDiasRango !== undefined && { minDiasRango: dto.minDiasRango }),
      ...(dto.maxDiasRango !== undefined && { maxDiasRango: dto.maxDiasRango }),
    };

    const row = await this.prisma.servicioTipoEvento.upsert({
      where: {
        servicioId_tipoEventoId: { servicioId, tipoEventoId },
      },
      create: { servicioId, tipoEventoId, ...data },
      update: data,
    });

    const efectiva = await this.tipoConfig.resolve(tipoEventoId, servicioId);
    return { override: row, efectiva, tipoEvento: tipo };
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.servicio.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Servicio ${id} no encontrado`);
    }
  }
}
