import { EstadoEvento } from '@prisma/client';
import {
  CODIGO_PERIODO_CERRADO,
  ValidacionEventoInput,
} from '../src/eventos/eventos-reglas.types';
import { inicioYFinLiquidacion } from '../src/exportaciones/export-rango.util';
import { fechaEnRangoInclusive } from '../src/eventos/utils/fechas.util';

describe('periodo bloqueo fechas', () => {
  it('1–15 del mes intersecta día 1 y 15 inclusive (fechas @db.Date)', () => {
    const desde = new Date('2026-07-01T12:00:00.000Z');
    const hasta = new Date('2026-07-15T12:00:00.000Z');
    expect(
      fechaEnRangoInclusive(new Date('2026-07-01T00:00:00.000Z'), desde, hasta),
    ).toBe(true);
    expect(
      fechaEnRangoInclusive(new Date('2026-07-15T00:00:00.000Z'), desde, hasta),
    ).toBe(true);
    expect(
      fechaEnRangoInclusive(new Date('2026-07-16T00:00:00.000Z'), desde, hasta),
    ).toBe(false);
  });

  it('código PERIODO_CERRADO definido', () => {
    expect(CODIGO_PERIODO_CERRADO).toBe('PERIODO_CERRADO');
  });

  it('liquidación julio no se usa como default de bloqueo (1–15 sí)', () => {
    const liq = inicioYFinLiquidacion('2026-07');
    expect(liq.desde.toISOString().slice(0, 10)).toBe('2026-06-16');
    expect(liq.hasta.toISOString().slice(0, 10)).toBe('2026-07-15');
  });
});

describe('eximePeriodoBloqueo en input', () => {
  it('admins pueden marcar eximePeriodoBloqueo', () => {
    const input: ValidacionEventoInput = {
      personaId: 1,
      tipoEventoId: 1,
      fechaDesde: new Date('2026-07-01T12:00:00.000Z'),
      fechaHasta: new Date('2026-07-01T12:00:00.000Z'),
      eximePeriodoBloqueo: true,
    };
    expect(input.eximePeriodoBloqueo).toBe(true);
    expect(EstadoEvento.ACTIVO).toBe('ACTIVO');
  });
});
