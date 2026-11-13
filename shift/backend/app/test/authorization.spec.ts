import { Rol } from '@prisma/client';
import { AuthorizationService } from '../src/common/authorization/authorization.service';
import { PersonaConRelaciones } from '../src/common/decorators/current-persona.decorator';

function actor(partial: Partial<PersonaConRelaciones> & { rol: Rol }): PersonaConRelaciones {
  return {
    id: 1,
    legajo: 1000,
    nombre: 'Test',
    funcionId: 1,
    servicioId: 1,
    activo: true,
    funcion: { id: 1, nombre: 'TEST' },
    servicio: { id: 1, nombre: 'TEST' },
    ...partial,
  } as PersonaConRelaciones;
}

describe('eximeVentanaTemporal', () => {
  const authz = new AuthorizationService({} as never);

  it('super admin queda exento (propio u ajeno)', () => {
    const a = actor({ rol: Rol.SUPER_ADMIN, id: 10 });
    expect(authz.eximeVentanaTemporal(a)).toBe(true);
  });

  it('admin de servicio queda exento', () => {
    const a = actor({ rol: Rol.ADMIN_SERVICIO, id: 20 });
    expect(authz.eximeVentanaTemporal(a)).toBe(true);
  });

  it('USER no queda exento', () => {
    const a = actor({ rol: Rol.USER, id: 30 });
    expect(authz.eximeVentanaTemporal(a)).toBe(false);
  });
});
