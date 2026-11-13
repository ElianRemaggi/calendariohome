import {
  formatFechaIso,
  parseFechaLocal,
  todayIsoArgentina,
} from '../src/eventos/utils/fechas.util';
import { CODIGO_ANTICIPACION_MINIMA } from '../src/eventos/eventos-reglas.types';

describe('anticipación mínima (USER)', () => {
  it('código ANTICIPACION_MINIMA definido', () => {
    expect(CODIGO_ANTICIPACION_MINIMA).toBe('ANTICIPACION_MINIMA');
  });

  it('hoy en Argentina es YYYY-MM-DD', () => {
    expect(todayIsoArgentina()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('día de hoy compara como <= hoy', () => {
    const hoy = todayIsoArgentina();
    expect(formatFechaIso(parseFechaLocal(hoy)) <= hoy).toBe(true);
  });

  it('mañana compara como > hoy', () => {
    const hoy = todayIsoArgentina();
    const [y, m, d] = hoy.split('-').map(Number);
    const manana = new Date(Date.UTC(y, m - 1, d + 1, 12));
    expect(formatFechaIso(manana) > hoy).toBe(true);
  });
});
