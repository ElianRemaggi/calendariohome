import { ForbiddenException, Injectable } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PersonaConRelaciones } from '../decorators/current-persona.decorator';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  isSuperAdmin(actor: PersonaConRelaciones): boolean {
    return actor.rol === Rol.SUPER_ADMIN;
  }

  isServiceAdmin(actor: PersonaConRelaciones): boolean {
    return actor.rol === Rol.ADMIN_SERVICIO;
  }

  isAnyAdmin(actor: PersonaConRelaciones): boolean {
    return this.isSuperAdmin(actor) || this.isServiceAdmin(actor);
  }

  async adminServicioIds(actor: PersonaConRelaciones): Promise<number[]> {
    if (this.isSuperAdmin(actor)) {
      return [];
    }
    if (!this.isServiceAdmin(actor)) {
      return [];
    }
    const rows = await this.prisma.personaAdminServicio.findMany({
      where: { personaId: actor.id },
      select: { servicioId: true },
    });
    return rows.map((r) => r.servicioId);
  }

  async canAdminServicio(
    actor: PersonaConRelaciones,
    servicioId: number,
  ): Promise<boolean> {
    if (this.isSuperAdmin(actor)) {
      return true;
    }
    const ids = await this.adminServicioIds(actor);
    return ids.includes(servicioId);
  }

  async assertCanAdminServicio(
    actor: PersonaConRelaciones,
    servicioId: number,
  ): Promise<void> {
    if (!(await this.canAdminServicio(actor, servicioId))) {
      throw new ForbiddenException('Sin permiso sobre este servicio');
    }
  }

  async assertPersonaEnServicioAdmin(
    actor: PersonaConRelaciones,
    personaId: number,
  ): Promise<void> {
    if (this.isSuperAdmin(actor)) {
      return;
    }
    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
      select: { servicioId: true },
    });
    if (!persona) {
      throw new ForbiddenException('Persona no encontrada');
    }
    await this.assertCanAdminServicio(actor, persona.servicioId);
  }

  async canActOnPersona(
    actor: PersonaConRelaciones,
    personaId: number,
  ): Promise<boolean> {
    if (actor.id === personaId) {
      return true;
    }
    if (this.isSuperAdmin(actor)) {
      return true;
    }
    if (!this.isServiceAdmin(actor)) {
      return false;
    }
    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
      select: { servicioId: true },
    });
    if (!persona) {
      return false;
    }
    return this.canAdminServicio(actor, persona.servicioId);
  }

  async assertCanActOnPersona(
    actor: PersonaConRelaciones,
    personaId: number,
  ): Promise<void> {
    if (!(await this.canActOnPersona(actor, personaId))) {
      throw new ForbiddenException('No puede operar sobre esta persona');
    }
  }

  actorEsAdminParaEventos(actor: PersonaConRelaciones): boolean {
    return this.isAnyAdmin(actor);
  }

  eximeVentanaTemporal(actor: PersonaConRelaciones): boolean {
    return this.isAnyAdmin(actor);
  }
}
