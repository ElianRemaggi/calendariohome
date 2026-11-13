import { ConflictException } from '@nestjs/common';

export function assertCanDeactivate(
  label: string,
  count: number,
  unidad: string,
): void {
  if (count > 0) {
    throw new ConflictException(
      `No se puede desactivar ${label}: hay ${count} ${unidad} asignado(s). Reasignelos antes de continuar.`,
    );
  }
}
