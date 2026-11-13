const TZ = 'America/Argentina/Buenos_Aires';

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00.000Z`);
}

export function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}

export function addMonths(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1, 12));
  return monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

/** Suma días a una fecha ISO (YYYY-MM-DD). */
export function addDays(iso: string, delta: number): string {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + delta);
  return formatIsoDate(d);
}

export function isSameMonth(iso: string, monthKeyStr: string): boolean {
  return iso.slice(0, 7) === monthKeyStr;
}

/** Rango de fechas de la grilla (incluye días de relleno del mes anterior/siguiente). */
export function calendarGridRange(monthKeyStr: string): { desde: string; hasta: string } {
  const { year, month } = parseMonthKey(monthKeyStr);
  const total = daysInMonth(year, month);
  const firstIso = `${monthKeyStr}-01`;
  const lastIso = `${monthKeyStr}-${String(total).padStart(2, '0')}`;
  const padStart = weekdaySundayFirst(firstIso);
  const desde = addDays(firstIso, -padStart);
  const padEnd = (7 - ((padStart + total) % 7)) % 7;
  const hasta = addDays(lastIso, padEnd);
  return { desde, hasta };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

export function isWeekendDate(date: Date): boolean {
  const w = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(date);
  return w === 'Sat' || w === 'Sun';
}

export function feriadoKey(iso: string): string {
  return iso.slice(0, 10);
}

export function eachDayInRange(desde: string, hasta: string): string[] {
  const days: string[] = [];
  const cur = parseIsoDate(desde);
  const fin = parseIsoDate(hasta);
  while (cur <= fin) {
    days.push(formatIsoDate(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export function eventoCoversDay(evento: { fechaDesde: string; fechaHasta: string }, dayIso: string): boolean {
  return evento.fechaDesde.slice(0, 10) <= dayIso && evento.fechaHasta.slice(0, 10) >= dayIso;
}

/** Mes actual en Argentina (YYYY-MM). */
export function currentMonthKeyArgentina(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value ?? '2000';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${y}-${m}`;
}

/** Fecha de hoy en Argentina (YYYY-MM-DD). */
export function todayIsoArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Diferencia en meses calendario: monthKey − refMonthKey. */
export function mesesEntre(monthKey: string, refMonthKey: string): number {
  const { year: y1, month: m1 } = parseMonthKey(monthKey);
  const { year: y2, month: m2 } = parseMonthKey(refMonthKey);
  return (y1 - y2) * 12 + (m1 - m2);
}

/** Rango ISO de fechas permitido para USER según offsets vs mes de referencia. */
export function ventanaFechasIso(
  refMonth: string,
  mesMinOffsetUser: number,
  mesMaxOffsetUser: number | null | undefined,
): { min: string; max?: string } {
  const minMonth = addMonths(refMonth, mesMinOffsetUser);
  const min = `${minMonth}-01`;
  if (mesMaxOffsetUser === null || mesMaxOffsetUser === undefined) {
    return { min };
  }
  const maxMonth = addMonths(refMonth, mesMaxOffsetUser);
  const { year: y2, month: m2 } = parseMonthKey(maxMonth);
  const last = daysInMonth(y2, m2);
  return { min, max: `${maxMonth}-${String(last).padStart(2, '0')}` };
}

/**
 * USER: no puede cargar hoy ni pasado (mínimo 1 día de anticipación).
 * Eleva `min` a mañana si hace falta. Si mañana queda después de `max`, la ventana queda vacía.
 */
export function aplicarAnticipacionMinima(ventana: {
  min: string;
  max?: string;
}): { min: string; max?: string } {
  const manana = addDays(todayIsoArgentina(), 1);
  const min = ventana.min > manana ? ventana.min : manana;
  if (ventana.max && min > ventana.max) {
    return { min, max: ventana.max };
  }
  return ventana.max !== undefined ? { min, max: ventana.max } : { min };
}

export function dayIsoEnVentana(
  dayIso: string,
  ventana: { min: string; max?: string } | null,
): boolean {
  if (!ventana) return true;
  if (dayIso < ventana.min) return false;
  if (ventana.max && dayIso > ventana.max) return false;
  return true;
}

export function monthKeyEnVentana(
  monthKey: string,
  refMonth: string,
  mesMinOffsetUser: number,
  mesMaxOffsetUser: number | null | undefined,
): boolean {
  const offset = mesesEntre(monthKey, refMonth);
  if (offset < mesMinOffsetUser) return false;
  if (
    mesMaxOffsetUser !== null &&
    mesMaxOffsetUser !== undefined &&
    offset > mesMaxOffsetUser
  ) {
    return false;
  }
  return true;
}

export function mensajeVentanaTemporal(
  refMonth: string,
  mesMinOffsetUser: number,
  mesMaxOffsetUser: number | null | undefined,
): string {
  const minOff = mesMinOffsetUser;
  const minM = addMonths(refMonth, minOff);
  const max = mesMaxOffsetUser;
  const anticipacion =
    'Además, debés anotarte con al menos un día de anticipación (no el día de hoy ni fechas pasadas).';
  if (max === null || max === undefined) {
    if (minOff === 0) {
      return `No podés cargar fechas en meses anteriores al mes en curso. ${anticipacion}`;
    }
    return `Podés cargar desde ${formatMonthYearTitle(minM)} en adelante. ${anticipacion}`;
  }
  const maxM = addMonths(refMonth, max);
  return `Podés cargar entre ${formatMonthYearTitle(minM)} y ${formatMonthYearTitle(maxM)}. ${anticipacion}`;
}

export function currentMonthKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')!.value;
  const month = parts.find((p) => p.type === 'month')!.value;
  return `${year}-${month}`;
}

const WEEKDAY_SUN_FIRST: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** true si el día ISO cae en sábado o domingo (zona Buenos Aires). */
export function isWeekendIso(iso: string): boolean {
  const wd = weekdaySundayFirst(iso);
  return wd === 0 || wd === 6;
}

/** 0 = domingo … 6 = sábado */
export function weekdaySundayFirst(iso: string): number {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(parseIsoDate(iso));
  return WEEKDAY_SUN_FIRST[label] ?? 0;
}

/** @deprecated Usar weekdaySundayFirst */
export function weekdayMondayFirst(iso: string): number {
  const sun = weekdaySundayFirst(iso);
  return sun === 0 ? 6 : sun - 1;
}

export function formatMonthLabel(monthKey: string): string {
  return formatMonthYearTitle(monthKey);
}

/** Título de mes en calendario: "Mayo 2026" */
export function formatMonthYearTitle(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(Date.UTC(year, month - 1, 1, 12));
  const monthName = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    month: 'long',
  }).format(d);
  const capitalized =
    monthName.charAt(0).toLocaleUpperCase('es-AR') + monthName.slice(1);
  return `${capitalized} ${year}`;
}

export function formatDayShort(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  }).format(parseIsoDate(iso));
}
