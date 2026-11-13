import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PersonaConRelaciones } from '../decorators/current-persona.decorator';

@Injectable()
export class ShiftLegajoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      persona?: PersonaConRelaciones;
    }>();

    const raw = request.headers['x-shift-legajo'];
    const legajoStr = Array.isArray(raw) ? raw[0] : raw;
    if (!legajoStr) {
      throw new UnauthorizedException('Header X-Shift-Legajo requerido');
    }

    const legajo = Number(legajoStr);
    if (!Number.isInteger(legajo) || legajo <= 0) {
      throw new UnauthorizedException('Legajo inválido');
    }

    const persona = await this.prisma.persona.findUnique({
      where: { legajo },
      include: { funcion: true, servicio: true },
    });

    if (!persona || !persona.activo) {
      throw new UnauthorizedException('Persona no encontrada o inactiva');
    }

    request.persona = persona;
    return true;
  }
}
