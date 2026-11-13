/**
 * Verificación grilla domingo–sábado (F09-T01)
 * Ejecutar: node test/fechas.sunday.mjs
 */

const TZ = 'America/Argentina/Buenos_Aires';

function parseIsoDate(iso) {
  return new Date(`${iso.slice(0, 10)}T12:00:00.000Z`);
}

const WEEKDAY_SUN_FIRST = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function weekdaySundayFirst(iso) {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(parseIsoDate(iso));
  return WEEKDAY_SUN_FIRST[label] ?? 0;
}

// 1 mayo 2026 = viernes → 5 celdas vacías (dom–jue) antes del día 1
const pad = weekdaySundayFirst('2026-05-01');
if (pad !== 5) {
  console.error('FAIL: pad esperado 5, obtuvo', pad);
  process.exit(1);
}

// 7 junio 2026 = domingo → 0 celdas vacías
const padDom = weekdaySundayFirst('2026-06-07');
if (padDom !== 0) {
  console.error('FAIL: domingo pad esperado 0, obtuvo', padDom);
  process.exit(1);
}

console.log('OK: grilla domingo–sábado');
