import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service';
import { PersonaConRelaciones } from '../decorators/current-persona.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly authz: AuthorizationService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      persona?: PersonaConRelaciones;
    }>();
    if (!request.persona || !this.authz.isSuperAdmin(request.persona)) {
      throw new ForbiddenException('Se requiere rol SUPER_ADMIN');
    }
    return true;
  }
}
