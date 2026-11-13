<template>
  <div class="w-full">
    <div class="mb-4 flex items-center justify-between gap-4">
      <button
        type="button"
        class="rounded-lg border border-shift-border bg-shift-card px-3 py-1.5 text-sm hover:border-shift-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Mes anterior"
        :disabled="!canGoPrev"
        @click="$emit('prev')"
      >
        ←
      </button>
      <h2 class="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        {{ monthLabel }}
      </h2>
      <button
        type="button"
        class="rounded-lg border border-shift-border bg-shift-card px-3 py-1.5 text-sm hover:border-shift-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Mes siguiente"
        :disabled="!canGoNext"
        @click="$emit('next')"
      >
        →
      </button>
    </div>

    <div
      class="mb-2 grid gap-1.5 text-center text-xs font-medium text-shift-muted"
      :class="gridColsClass"
    >
      <span v-for="d in weekDaysDisplay" :key="d">{{ d }}</span>
    </div>

    <div
      v-if="eventoEnVuelo"
      class="pointer-events-none fixed z-50 max-w-[10rem] truncate rounded border-2 border-dashed border-shift-accent px-2 py-1 text-[11px] font-bold shadow-lg"
      :style="[chipStyle(eventoEnVuelo), ghostStyle]"
      aria-hidden="true"
    >
      {{ chipLabel(eventoEnVuelo) }}
    </div>

    <div class="grid gap-1.5" :class="gridColsClass">
      <div
        v-for="cell in visibleCells"
        :key="cell.dayIso"
        :data-day-iso="cell.dayIso"
        class="min-h-[5.75rem] rounded-lg p-1.5 text-sm transition"
        :class="cellClass(cell)"
        :style="cellStyle(cell)"
        @click="onCellClick(cell)"
      >
        <template v-if="cell.dayIso">
          <div class="flex items-center justify-between gap-1">
            <span
              class="font-semibold"
              :class="dayNumClass(cell)"
            >{{ cell.dayNum }}</span>
            <div class="flex min-w-0 flex-1 items-center justify-end gap-1">
              <span
                v-if="cell.feriadoLabel"
                class="min-w-0 max-w-[55%] truncate rounded px-1 text-[10px] font-medium text-shift-muted"
                :title="cell.feriadoLabel"
              >
                {{ cell.feriadoLabel }}
              </span>
              <div
                v-if="totalPaginasChips(cell) > 1"
                class="flex shrink-0 items-center gap-0.5"
              >
                <button
                  type="button"
                  class="inline-flex h-5 w-5 items-center justify-center rounded border border-shift-border/70 text-sm leading-none text-shift-muted transition hover:border-shift-accent/50 hover:text-white disabled:cursor-default disabled:opacity-30"
                  :disabled="paginaChips(cell) === 0"
                  :aria-label="`Personas anteriores el ${cell.dayIso}`"
                  @click.stop="cambiarPaginaChips(cell, -1)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  class="inline-flex h-5 w-5 items-center justify-center rounded border border-shift-border/70 text-sm leading-none text-shift-muted transition hover:border-shift-accent/50 hover:text-white disabled:cursor-default disabled:opacity-30"
                  :disabled="paginaChips(cell) >= totalPaginasChips(cell) - 1"
                  :aria-label="`Personas siguientes el ${cell.dayIso}`"
                  @click.stop="cambiarPaginaChips(cell, 1)"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          <ul class="mt-1 flex flex-col gap-0.5">
            <li
              v-for="ev in eventosVisiblesEnCelda(cell)"
              :key="ev.id"
              class="truncate rounded border px-1 py-0.5 text-[11px] font-bold leading-tight touch-none select-none"
              :class="chipClass(ev)"
              :style="chipStyle(ev)"
              @click.stop="onChipClick(ev, $event)"
              @pointerdown="onChipPointerDown(cell, ev, $event)"
              @pointermove="onChipPointerMove"
              @pointerup="onChipPointerUp"
              @pointercancel="onChipPointerCancel"
            >
              {{ chipLabel(ev) }}
              <span v-if="ev.excesoCupo" class="ml-0.5 opacity-90">*</span>
            </li>
            <li v-if="paginaChips(cell) < totalPaginasChips(cell) - 1">
              <button
                type="button"
                class="w-full truncate text-left text-[10px] text-shift-muted transition hover:text-shift-accent"
                :aria-label="`Ver más personas el ${cell.dayIso}`"
                @click.stop="cambiarPaginaChips(cell, 1)"
              >
                +{{ ocultosDespuesPagina(cell) }} más
              </button>
            </li>
          </ul>
        </template>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-4 text-xs text-shift-muted">
      <span class="inline-flex items-center gap-2">
        <span
          class="h-3 w-6 rounded border border-shift-border"
          :style="nonLaborableLegendStyle"
        />
        Fin de semana / Feriado
      </span>
      <span>Cada color = una persona</span>
      <span class="text-shift-accent/90">
        Más de 4 en un día: ‹ › arriba a la derecha o «+N más» abajo
      </span>
      <span v-if="habilitarArrastre" class="text-shift-accent/90">
        Arrastrá tu chip (se corta del día origen) a otro día del mes; clic corto = ver o cancelar
      </span>
      <span v-if="hideWeekends" class="text-shift-accent/90">
        Vista Lun–Vie (fines de semana ocultos)
      </span>
      <span class="inline-flex items-center gap-2">
        <span class="h-3 w-6 rounded border-2 border-shift-accent bg-shift-day" />
        Hoy
      </span>
      <span class="inline-flex items-center gap-2">
        <span
          class="h-3 w-6 rounded border border-shift-border/50"
          style="background-color: var(--shift-day-adjacent-bg)"
        />
        Fuera de período / cerrado
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Evento } from '~/types';
import { useEventoChipDrag } from '~/composables/useEventoChipDrag';
import { chipStyleForPersona, preferenciaFromPersona } from '~/utils/persona-colors';
import {
  addDays,
  daysInMonth,
  eventoCoversDay,
  formatMonthLabel,
  isSameMonth,
  isWeekendDate,
  isWeekendIso,
  parseIsoDate,
  parseMonthKey,
  todayIsoArgentina,
  weekdaySundayFirst,
  dayIsoEnVentana,
} from '~/utils/fechas';

const props = withDefaults(
  defineProps<{
    month: string;
    eventos: Evento[];
    /** ISO date → etiqueta (descripción o "Feriado") */
    feriados: Record<string, string>;
    /** Solo Lun–Vie (p. ej. calendario estrecho con panel de chat abierto). */
    hideWeekends?: boolean;
    /** IDs de personas visibles, ordenados, para asignar color único por slot. */
    personaIdsOrdenados?: number[];
    /** Rango ISO permitido para alta (días fuera = no clicables). */
    ventanaFechas?: { min: string; max?: string } | null;
    /**
     * Días ISO con período cerrado (bloqueo post-export).
     * Mismo estilo gris que fuera de ventana; clicables solo si permitirClicPeriodoCerrado.
     */
    diasPeriodoCerrado?: string[] | Set<string> | null;
    /** Si true (admins), se puede abrir el día aunque esté cerrado. */
    permitirClicPeriodoCerrado?: boolean;
    /** Si true (admins), clic y drop en días fuera de la ventana R6 del mes visible. */
    permitirClicFueraVentana?: boolean;
    canGoPrev?: boolean;
    canGoNext?: boolean;
    /** Permite arrastrar chips propios de un día (HO, etc.). */
    habilitarArrastre?: boolean;
    personaIdActual?: number;
  }>(),
  {
    canGoPrev: true,
    canGoNext: true,
    habilitarArrastre: false,
    permitirClicPeriodoCerrado: false,
    permitirClicFueraVentana: false,
  },
);

const emit = defineEmits<{
  prev: [];
  next: [];
  'select-day': [dayIso: string];
  'select-evento': [evento: Evento];
  'mover-evento': [evento: Evento, dayIso: string];
}>();

const CHIPS_POR_PAGINA = 4;

const { theme } = useTheme();

const WEEK_DAYS_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const WEEK_DAYS_WORK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] as const;

const gridColsClass = computed(() =>
  props.hideWeekends ? 'grid-cols-5' : 'grid-cols-7',
);

const weekDaysDisplay = computed(() =>
  props.hideWeekends ? [...WEEK_DAYS_WORK] : [...WEEK_DAYS_FULL],
);

const monthLabel = computed(() => formatMonthLabel(props.month));

interface CalendarCell {
  dayIso: string;
  dayNum: number;
  eventos: Evento[];
  isWeekend: boolean;
  isFeriado: boolean;
  feriadoLabel: string | null;
  /** Día fuera del mes mostrado (solo lectura, tono gris). */
  isAdjacentMonth: boolean;
  isToday: boolean;
  fueraVentana: boolean;
  /** Período cerrado (bloqueo admin); mismo tono gris. */
  periodoCerrado: boolean;
}

const diasCerradosSet = computed(() => {
  const raw = props.diasPeriodoCerrado;
  if (!raw) return new Set<string>();
  if (raw instanceof Set) return raw;
  return new Set(raw);
});

const cells = computed((): CalendarCell[] => {
  const { year, month } = parseMonthKey(props.month);
  const total = daysInMonth(year, month);
  const firstIso = `${props.month}-01`;
  const lastIso = `${props.month}-${String(total).padStart(2, '0')}`;
  const padStart = weekdaySundayFirst(firstIso);
  const activos = props.eventos.filter((e) => e.estado === 'ACTIVO');
  const hoy = todayIsoArgentina();
  const cerrados = diasCerradosSet.value;
  const result: CalendarCell[] = [];

  function buildCell(dayIso: string): CalendarCell {
    const date = parseIsoDate(dayIso);
    const feriadoLabel = props.feriados[dayIso] ?? null;
    return {
      dayIso,
      dayNum: Number(dayIso.slice(8, 10)),
      eventos: activos.filter((e) => eventoCoversDay(e, dayIso)),
      isWeekend: isWeekendDate(date),
      isFeriado: !!feriadoLabel,
      feriadoLabel,
      isAdjacentMonth: !isSameMonth(dayIso, props.month),
      isToday: dayIso === hoy,
      fueraVentana: !dayIsoEnVentana(dayIso, props.ventanaFechas ?? null),
      periodoCerrado: cerrados.has(dayIso),
    };
  }

  for (let i = padStart; i > 0; i--) {
    result.push(buildCell(addDays(firstIso, -i)));
  }

  for (let d = 1; d <= total; d++) {
    result.push(buildCell(`${props.month}-${String(d).padStart(2, '0')}`));
  }

  let tail = 1;
  while (result.length % 7 !== 0) {
    result.push(buildCell(addDays(lastIso, tail)));
    tail++;
  }

  return result;
});

const visibleCells = computed(() => {
  if (!props.hideWeekends) return cells.value;
  return cells.value.filter((cell) => !isWeekendIso(cell.dayIso));
});

const paginaChipsPorDia = ref<Record<string, number>>({});

watch(
  () => props.month,
  () => {
    paginaChipsPorDia.value = {};
  },
);

function paginaChips(cell: CalendarCell): number {
  return paginaChipsPorDia.value[cell.dayIso] ?? 0;
}

function totalPaginasChips(cell: CalendarCell): number {
  return Math.ceil(cell.eventos.length / CHIPS_POR_PAGINA);
}

function eventosVisiblesEnCelda(cell: CalendarCell): Evento[] {
  const pagina = Math.min(paginaChips(cell), Math.max(totalPaginasChips(cell) - 1, 0));
  const inicio = pagina * CHIPS_POR_PAGINA;
  return cell.eventos.slice(inicio, inicio + CHIPS_POR_PAGINA);
}

function ocultosDespuesPagina(cell: CalendarCell): number {
  const inicio = paginaChips(cell) * CHIPS_POR_PAGINA;
  const fin = inicio + CHIPS_POR_PAGINA;
  return Math.max(0, cell.eventos.length - fin);
}

function cambiarPaginaChips(cell: CalendarCell, delta: number) {
  const total = totalPaginasChips(cell);
  if (total <= 1) return;
  const actual = paginaChips(cell);
  const siguiente = Math.min(Math.max(actual + delta, 0), total - 1);
  if (siguiente === actual) return;
  paginaChipsPorDia.value = { ...paginaChipsPorDia.value, [cell.dayIso]: siguiente };
}

const personaIdRef = computed(() => props.personaIdActual);
const habilitarArrastreRef = computed(() => props.habilitarArrastre);
const monthRef = computed(() => props.month);
const permitirDropFueraVentanaRef = computed(
  () => !!props.permitirClicFueraVentana,
);

const cellsByDayIso = computed(() => {
  const map = new Map<string, CalendarCell>();
  for (const c of cells.value) {
    map.set(c.dayIso, c);
  }
  return map;
});

const {
  dragSession,
  puedeArrastrar,
  onChipPointerDown,
  onChipPointerMove,
  onChipPointerUp,
  onChipPointerCancel,
  consumirClickSiArrastre,
  chipOcultoEnOrigen,
  eventoEnVuelo,
  ghostStyle,
  celdaEsDestino,
  celdaEsOrigenMovimiento,
} = useEventoChipDrag({
  month: monthRef,
  personaIdActual: personaIdRef,
  habilitarArrastre: habilitarArrastreRef,
  getCellByDayIso: (dayIso) => cellsByDayIso.value.get(dayIso),
  onMover: (evento, dayIso) => emit('mover-evento', evento, dayIso),
  permitirDropFueraVentana: permitirDropFueraVentanaRef,
});

function onChipClick(ev: Evento, e: MouseEvent) {
  e.stopPropagation();
  if (consumirClickSiArrastre()) return;
  emit('select-evento', ev);
}

function celdaSoloLectura(cell: CalendarCell): boolean {
  if (cell.isAdjacentMonth) return true;
  if (cell.fueraVentana && !props.permitirClicFueraVentana) return true;
  if (cell.periodoCerrado && !props.permitirClicPeriodoCerrado) return true;
  return false;
}

function celdaEstiloGris(cell: CalendarCell): boolean {
  return cell.isAdjacentMonth || cell.fueraVentana || cell.periodoCerrado;
}

function onCellClick(cell: CalendarCell) {
  if (dragSession.value?.dragging) return;
  if (celdaSoloLectura(cell)) return;
  emit('select-day', cell.dayIso);
}

const nonLaborableLegendStyle = {
  backgroundColor: 'var(--shift-weekend-bg)',
  backgroundImage: 'var(--shift-weekend-pattern)',
};

function isNonLaborable(cell: CalendarCell): boolean {
  return cell.isWeekend || cell.isFeriado;
}

function chipClass(ev: Evento): string {
  const parts: string[] = ['cursor-pointer'];
  if (puedeArrastrar(ev)) {
    parts.push('active:cursor-grabbing');
  }
  if (chipOcultoEnOrigen(ev)) {
    parts.push('invisible');
  }
  return parts.join(' ');
}

function cellClass(cell: CalendarCell): string {
  const border = cell.isToday
    ? 'border-2 border-shift-accent'
    : cell.isAdjacentMonth
      ? 'border border-shift-border/50'
      : 'border border-shift-border/80';

  if (celdaEsDestino(cell)) {
    return `border-2 border-emerald-500/90 bg-emerald-950/30 ring-1 ring-emerald-400/60 ${border}`.trim();
  }

  if (celdaEsOrigenMovimiento(cell)) {
    return `border border-dashed border-shift-muted/60 bg-shift-day/40 opacity-90 ${border}`.trim();
  }

  if (cell.isAdjacentMonth || cell.fueraVentana || cell.periodoCerrado) {
    const muted = cell.isToday ? '' : 'opacity-80';
    const clicable =
      (!cell.isAdjacentMonth &&
        cell.fueraVentana &&
        props.permitirClicFueraVentana) ||
      (cell.periodoCerrado && props.permitirClicPeriodoCerrado);
    const cursor = clicable ? 'cursor-pointer' : 'cursor-default';
    return `${cursor} ${border} ${muted}`.trim();
  }
  if (isNonLaborable(cell)) {
    return `cursor-pointer ${border} hover:border-shift-accent/60`;
  }
  return `cursor-pointer ${border} bg-shift-day hover:border-shift-accent/50`;
}

function dayNumClass(cell: CalendarCell): string {
  if (cell.isToday) return 'text-shift-accent';
  if (celdaEstiloGris(cell)) return 'text-shift-muted';
  return '';
}

function cellStyle(cell: CalendarCell): Record<string, string> | undefined {
  if (celdaEstiloGris(cell)) {
    return { backgroundColor: 'var(--shift-day-adjacent-bg)' };
  }
  if (isNonLaborable(cell)) {
    return {
      backgroundColor: 'var(--shift-weekend-bg)',
      backgroundImage: 'var(--shift-weekend-pattern)',
    };
  }
  return { backgroundColor: 'var(--shift-day-bg)' };
}

function chipLabel(ev: Evento): string {
  const nombre = ev.persona?.nombre?.trim();
  if (nombre) {
    return nombre.toUpperCase();
  }
  return ev.tipoEvento.nombre;
}

function chipStyle(ev: Evento): Record<string, string> {
  const pid = ev.persona?.id ?? ev.personaId;
  const slot = props.personaIdsOrdenados?.indexOf(pid);
  return chipStyleForPersona(
    pid,
    theme.value,
    slot !== undefined && slot >= 0 ? slot : undefined,
    preferenciaFromPersona(ev.persona),
  );
}
</script>
