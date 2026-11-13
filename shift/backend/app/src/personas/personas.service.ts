import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import {
  datosColorCalendarioDesdeDto,
  validarPreferenciaColorCalendario,
} from './persona-color.util';
import { UpdatePersonaDto } from './dto/update-persona.dto';

const personaInclude = {
  funcion: true,
  servicio: true,
} as const;

const SUPER_ADMIN_LEGAJO = 9147;

@Injectable()
export class PersonasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
  ) {}

  async findByLegajo(legajo: number) {
    const persona = await this.prisma.persona.findUnique({
      where: { legajo },
      include: personaInclude,
    });
    if (!persona || !persona.activo) {
      throw new NotFoundException(`Legajo ${legajo} no encontrado`);
    }
    const adminServicioIds = await this.authz.adminServicioIds(persona);
    return { ...persona, adminServicioIds };
  }

  async create(dto: CreatePersonaDto, actor?: PersonaConRelaciones) {
    const esRegistroPublico = !actor;

    if (esRegistroPublico) {
      if (dto.rol && dto.rol !== Rol.USER) {
        throw new ForbiddenException('El auto-registro solo permite rol USER');
      }
    } else if (!this.authz.isAnyAdmin(actor)) {
      throw new ForbiddenException('Se requiere rol de administrador');
    } else if (!this.authz.isSuperAdmin(actor)) {
      await this.authz.assertCanAdminServicio(actor, dto.servicioId);
    }

    const exists = await this.prisma.persona.findUnique({
      where: { legajo: dto.legajo },
    });
    if (exists) {
      throw new ConflictException(`Legajo ${dto.legajo} ya registrado`);
    }
    await this.ensureFuncionServicio(dto.funcionId, dto.servicioId);

    const rol = esRegistroPublico ? Rol.USER : (dto.rol ?? Rol.USER);
    if (!esRegistroPublico && rol === Rol.SUPER_ADMIN && !this.authz.isSuperAdmin(actor!)) {
      throw new ForbiddenException('No puede asignar SUPER_ADMIN');
    }
    if (!esRegistroPublico && rol === Rol.SUPER_ADMIN && dto.legajo !== SUPER_ADMIN_LEGAJO) {
      throw new BadRequestException('SUPER_ADMIN reservado para legajo 9147');
    }

    const persona = await this.prisma.persona.create({
      data: {
        legajo: dto.legajo,
        nombre: dto.nombre.trim(),
        funcionId: dto.funcionId,
        servicioId: dto.servicioId,
        rol,
      },
      include: personaInclude,
    });

    if (rol === Rol.ADMIN_SERVICIO) {
      await this.syncAdminServicio(persona.id, dto.servicioId, true);
    }

    const adminServicioIds = await this.authz.adminServicioIds(persona);
    return { ...persona, adminServicioIds };
  }

  async update(
    id: number,
    dto: UpdatePersonaDto,
    actor: PersonaConRelaciones,
  ) {
    if (dto.legajo !== undefined) {
      throw new ForbiddenException('El legajo no puede modificarse');
    }

    const esAdmin = this.authz.isAnyAdmin(actor);
    const edicionPropia = actor.id === id;

    if (!esAdmin && !edicionPropia) {
      throw new ForbiddenException('Solo puede editar su propio perfil');
    }

    if (!esAdmin && (dto.rol !== undefined || dto.activo !== undefined)) {
      throw new ForbiddenException('No puede modificar rol ni estado de baja');
    }

    if (
      !esAdmin &&
      edicionPropia &&
      (dto.funcionId !== undefined || dto.servicioId !== undefined)
    ) {
      throw new ForbiddenException('No puede cambiar función ni servicio');
    }

    const persona = await this.prisma.persona.findUnique({ where: { id } });
    if (!persona) {
      throw new NotFoundException(`Persona ${id} no encontrada`);
    }

    if (!this.authz.isSuperAdmin(actor) && !edicionPropia) {
      await this.authz.assertPersonaEnServicioAdmin(actor, id);
      if (dto.servicioId !== undefined && dto.servicioId !== persona.servicioId) {
        throw new ForbiddenException(
          'No puede reasignar empleados a otro servicio',
        );
      }
    }

    if (dto.rol !== undefined && dto.rol !== persona.rol) {
      await this.assertCambioRolPermitido(persona, dto.rol, actor);
    }

    if (dto.colorCalendarioPersonalizado !== undefined) {
      validarPreferenciaColorCalendario(dto);
    }

    const servicioId = dto.servicioId ?? persona.servicioId;
    if (dto.funcionId !== undefined || dto.servicioId !== undefined) {
      await this.ensureFuncionServicio(
        dto.funcionId ?? persona.funcionId,
        servicioId,
      );
    }

    const nuevoRol = dto.rol ?? persona.rol;
    if (nuevoRol === Rol.SUPER_ADMIN && !this.authz.isSuperAdmin(actor)) {
      throw new ForbiddenException('No puede asignar SUPER_ADMIN');
    }

    const updated = await this.prisma.persona.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.funcionId !== undefined && { funcionId: dto.funcionId }),
        ...(dto.servicioId !== undefined && { servicioId: dto.servicioId }),
        ...(dto.rol !== undefined && { rol: dto.rol }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...datosColorCalendarioDesdeDto(dto),
      },
      include: personaInclude,
    });

    if (dto.rol !== undefined) {
      if (dto.rol === Rol.ADMIN_SERVICIO) {
        await this.syncAdminServicio(id, updated.servicioId, true);
      } else {
        await this.prisma.personaAdminServicio.deleteMany({
          where: { personaId: id },
        });
      }
    } else if (
      updated.rol === Rol.ADMIN_SERVICIO &&
      dto.servicioId !== undefined
    ) {
      await this.syncAdminServicio(id, updated.servicioId, true);
    }

    const adminServicioIds = await this.authz.adminServicioIds(updated);
    return { ...updated, adminServicioIds };
  }

  async remove(id: number, actor: PersonaConRelaciones) {
    if (!this.authz.isAnyAdmin(actor)) {
      throw new ForbiddenException('Se requiere rol de administrador');
    }
    if (actor.id === id) {
      throw new BadRequestException('No puede eliminarse a sí mismo');
    }

    const persona = await this.prisma.persona.findUnique({ where: { id } });
    if (!persona) {
      throw new NotFoundException(`Persona ${id} no encontrada`);
    }

    if (!this.authz.isSuperAdmin(actor)) {
      await this.authz.assertPersonaEnServicioAdmin(actor, id);
    }

    const eventos = await this.prisma.evento.count({ where: { personaId: id } });
    if (eventos > 0) {
      throw new ConflictException(
        `No se puede eliminar: el legajo ${persona.legajo} tiene ${eventos} evento(s) registrados`,
      );
    }

    if (persona.rol === Rol.SUPER_ADMIN) {
      const otros = await this.prisma.persona.count({
        where: { rol: Rol.SUPER_ADMIN, activo: true, id: { not: id } },
      });
      if (otros === 0) {
        throw new BadRequestException(
          'No se puede eliminar al último super administrador activo',
        );
      }
    }

    await this.prisma.persona.delete({ where: { id } });
    return { ok: true };
  }

  private async syncAdminServicio(
    personaId: number,
    servicioId: number,
    replaceAll: boolean,
  ) {
    if (replaceAll) {
      await this.prisma.personaAdminServicio.deleteMany({
        where: { personaId },
      });
    }
    await this.prisma.personaAdminServicio.upsert({
      where: {
        personaId_servicioId: { personaId, servicioId },
      },
      create: { personaId, servicioId },
      update: {},
    });
  }

  private async assertCambioRolPermitido(
    persona: { id: number; rol: Rol; legajo: number },
    nuevoRol: Rol,
    actor: PersonaConRelaciones,
  ) {
    if (nuevoRol === Rol.SUPER_ADMIN && !this.authz.isSuperAdmin(actor)) {
      throw new ForbiddenException('No puede asignar SUPER_ADMIN');
    }
    if (persona.id === actor.id && nuevoRol === Rol.USER) {
      if (actor.rol === Rol.SUPER_ADMIN) {
        throw new BadRequestException(
          'No puede quitarse el rol de super administrador a sí mismo',
        );
      }
    }
    if (persona.rol === Rol.SUPER_ADMIN && nuevoRol !== Rol.SUPER_ADMIN) {
      const otros = await this.prisma.persona.count({
        where: { rol: Rol.SUPER_ADMIN, activo: true, id: { not: persona.id } },
      });
      if (otros === 0) {
        throw new BadRequestException(
          'Debe quedar al menos un super administrador activo',
        );
      }
    }
  }

  private async ensureFuncionServicio(funcionId: number, servicioId: number) {
    const [funcion, servicio] = await Promise.all([
      this.prisma.funcion.findFirst({ where: { id: funcionId, activo: true } }),
      this.prisma.servicio.findFirst({ where: { id: servicioId, activo: true } }),
    ]);
    if (!funcion) {
      throw new NotFoundException(`Función ${funcionId} no encontrada o inactiva`);
    }
    if (!servicio) {
      throw new NotFoundException(`Servicio ${servicioId} no encontrado o inactivo`);
    }
    if (funcion.servicioId !== null && funcion.servicioId !== servicioId) {
      throw new BadRequestException(
        'La función no pertenece al servicio indicado',
      );
    }
  }
}
