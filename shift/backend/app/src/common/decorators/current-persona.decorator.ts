import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Persona } from '@prisma/client';

export type PersonaConRelaciones = Persona & {
  funcion: { id: number; nombre: string };
  servicio: { id: number; nombre: string };
};

export const CurrentPersona = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PersonaConRelaciones | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      persona?: PersonaConRelaciones;
    }>();
    return request.persona;
  },
);
