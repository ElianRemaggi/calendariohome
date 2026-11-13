const TZ = 'America/Argentina/Buenos_Aires';

/** Parsea YYYY-MM-DD a Date (mediodía UTC para evitar desfases). */
export function parseFechaLocal(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

export function formatFechaIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Medianoche UTC del día calendario (parte de fecha UTC).
 * Útil para filtrar columnas Prisma `@db.Date`, que al leer vuelven como T00:00:00.000Z.
 * Comparar esas fechas contra límites a mediodía excluye el primer día del rango.
 */
export function inicioDiaUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Comparación inclusiva por día calendario (ignora hora). */
export function fechaEnRangoInclusive(
  fecha: Date,
  desde: Date,
  hasta: Date,
): boolean {
  const d = formatFechaIso(fecha);
  return d >= formatFechaIso(desde) && d <= formatFechaIso(hasta);
}

/** Formato D/M/YYYY (Argentina) para fechas calendario almacenadas en UTC. */
export function formatFechaEsAr(date: Date): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function cadaDiaEnRango(desde: Date, hasta: Date): Date[] {
  const dias: Date[] = [];
  const cur = new Date(desde);
  const fin = new Date(hasta);
  while (cur <= fin) {
    dias.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dias;
}

export function diaSemanaBuenosAires(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).formatToParts(date);
  const w = parts.find((p) => p.type === 'weekday')?.value;
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[w ?? 'Mon'] ?? 1;
}

export function esFinDeSemana(date: Date): boolean {
  const d = diaSemanaBuenosAires(date);
  return d === 0 || d === 6;
}

export function rangoIntersectaMes(
  desde: Date,
  hasta: Date,
  month: string,
): boolean {
  const [y, m] = month.split('-').map(Number);
  const inicioMes = new Date(Date.UTC(y, m - 1, 1, 12));
  const finMes = new Date(Date.UTC(y, m, 0, 12));
  return desde <= finMes && hasta >= inicioMes;
}

/** Mes calendario actual en Argentina (YYYY-MM). */
export function mesActualArgentina(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
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

export function fechaEnMes(date: Date, month: string): boolean {
  return formatFechaIso(date).startsWith(`${month}-`);
}

/** Diferencia en meses calendario: monthKey - refMonthKey (ej. ref+1 → 1). */
export function mesesEntre(monthKey: string, refMonthKey: string): number {
  const [y1, m1] = monthKey.split('-').map(Number);
  const [y2, m2] = refMonthKey.split('-').map(Number);
  return (y1 - y2) * 12 + (m1 - m2);
}

export function monthKeyFromDate(date: Date): string {
  return formatFechaIso(date).slice(0, 7);
}

export function inicioYFinMes(month: string): { desde: Date; hasta: Date } {
  const [y, m] = month.split('-').map(Number);
  return {
    desde: new Date(Date.UTC(y, m - 1, 1, 12)),
    hasta: new Date(Date.UTC(y, m, 0, 12)),
  };
}
