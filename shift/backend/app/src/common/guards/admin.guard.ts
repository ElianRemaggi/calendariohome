import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service';
import { PersonaConRelaciones } from '../decorators/current-persona.decorator';

/** Super admin o admin de servicio. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authz: AuthorizationService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      persona?: PersonaConRelaciones;
    }>();
    if (!request.persona || !this.authz.isAnyAdmin(request.persona)) {
      throw new ForbiddenException('Se requiere rol de administrador');
    }
    return true;
  }
}
