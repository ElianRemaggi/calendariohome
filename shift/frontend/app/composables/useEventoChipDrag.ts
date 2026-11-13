import type { Evento } from '~/types';
import { isSameMonth } from '~/utils/fechas';

const DRAG_THRESHOLD_PX = 8;

export interface EventoChipDragCell {
  dayIso: string;
  isAdjacentMonth: boolean;
  isWeekend: boolean;
  isFeriado: boolean;
  fueraVentana: boolean;
  eventos: Evento[];
}

interface DragSession {
  evento: Evento;
  fromDayIso: string;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
  target: HTMLElement;
}

export function useEventoChipDrag(options: {
  month: Ref<string>;
  personaIdActual: Ref<number | undefined>;
  habilitarArrastre: Ref<boolean>;
  getCellByDayIso: (dayIso: string) => EventoChipDragCell | undefined;
  onMover: (evento: Evento, dayIso: string) => void;
  /** Admin: permitir soltar en días fuera de la ventana R6 del mes visible. */
  permitirDropFueraVentana?: Ref<boolean>;
}) {
  const dragSession = ref<DragSession | null>(null);
  const dropTargetDayIso = ref<string | null>(null);
  const ghostPos = ref({ x: 0, y: 0 });
  /** Evita que el click post-arrastre abra el modal o la celda. */
  const bloquearClickSiguiente = ref(false);

  function puedeArrastrar(ev: Evento): boolean {
    if (!options.habilitarArrastre.value || !options.personaIdActual.value) {
      return false;
    }
    if (ev.personaId !== options.personaIdActual.value) return false;
    if (ev.estado !== 'ACTIVO') return false;
    if (ev.tipoEvento?.permiteCargaPorRango) return false;
    const d = ev.fechaDesde.slice(0, 10);
    const h = ev.fechaHasta.slice(0, 10);
    return d === h;
  }

  function celdaAceptaDrop(cell: EventoChipDragCell, ev: Evento): boolean {
    if (!dragSession.value?.dragging) return false;
    if (cell.isAdjacentMonth) return false;
    if (!isSameMonth(cell.dayIso, options.month.value)) return false;
    if (cell.dayIso === dragSession.value.fromDayIso) return false;
    if (cell.fueraVentana && !options.permitirDropFueraVentana?.value) return false;
    if (cell.isWeekend && ev.tipoEvento.bloqueaFinDeSemana !== false) {
      return false;
    }
    if (cell.isFeriado && ev.tipoEvento.bloqueaFeriado !== false) {
      return false;
    }
    const otroPropio = cell.eventos.some(
      (e) =>
        e.id !== ev.id &&
        e.estado === 'ACTIVO' &&
        e.personaId === ev.personaId,
    );
    return !otroPropio;
  }

  function actualizarDropTarget(clientX: number, clientY: number) {
    ghostPos.value = { x: clientX, y: clientY };
    const el = document.elementFromPoint(clientX, clientY);
    const cellEl = el?.closest('[data-day-iso]') as HTMLElement | null;
    const dayIso = cellEl?.dataset.dayIso;
    if (!dayIso || !dragSession.value) {
      dropTargetDayIso.value = null;
      return;
    }
    const cell = options.getCellByDayIso(dayIso);
    if (cell && celdaAceptaDrop(cell, dragSession.value.evento)) {
      dropTargetDayIso.value = dayIso;
    } else {
      dropTargetDayIso.value = null;
    }
  }

  function onChipPointerDown(
    cell: EventoChipDragCell,
    ev: Evento,
    e: PointerEvent,
  ) {
    if (!puedeArrastrar(ev)) return;
    const target = e.currentTarget as HTMLElement;
    dragSession.value = {
      evento: ev,
      fromDayIso: cell.dayIso,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      target,
    };
    dropTargetDayIso.value = null;
    ghostPos.value = { x: e.clientX, y: e.clientY };
    target.setPointerCapture(e.pointerId);
  }

  function onChipPointerMove(e: PointerEvent) {
    const s = dragSession.value;
    if (!s || e.pointerId !== s.pointerId) return;
    if (!s.dragging) {
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        s.dragging = true;
      }
    }
    if (s.dragging) {
      e.preventDefault();
      actualizarDropTarget(e.clientX, e.clientY);
    }
  }

  function finalizarPointer(e: PointerEvent) {
    const s = dragSession.value;
    if (!s || e.pointerId !== s.pointerId) return;
    const fueArrastre = s.dragging;
    try {
      s.target.releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
    if (fueArrastre) {
      bloquearClickSiguiente.value = true;
      const dest = dropTargetDayIso.value;
      if (dest) {
        options.onMover(s.evento, dest);
      }
    }
    dragSession.value = null;
    dropTargetDayIso.value = null;
  }

  function onChipPointerUp(e: PointerEvent) {
    finalizarPointer(e);
  }

  function onChipPointerCancel(e: PointerEvent) {
    finalizarPointer(e);
  }

  /** Llamar desde @click.stop del chip; devuelve true si el click debe ignorarse. */
  function consumirClickSiArrastre(): boolean {
    if (bloquearClickSiguiente.value) {
      bloquearClickSiguiente.value = false;
      return true;
    }
    if (dragSession.value?.dragging) return true;
    return false;
  }

  function chipOcultoEnOrigen(ev: Evento): boolean {
    return (
      !!dragSession.value?.dragging &&
      dragSession.value.evento.id === ev.id
    );
  }

  const eventoEnVuelo = computed(() =>
    dragSession.value?.dragging ? dragSession.value.evento : null,
  );

  const ghostStyle = computed((): Record<string, string> => {
    const { x, y } = ghostPos.value;
    return {
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
    };
  });

  function celdaEsDestino(cell: EventoChipDragCell): boolean {
    return (
      !!dragSession.value?.dragging &&
      dropTargetDayIso.value === cell.dayIso &&
      celdaAceptaDrop(cell, dragSession.value.evento)
    );
  }

  function celdaEsOrigenMovimiento(cell: EventoChipDragCell): boolean {
    return (
      !!dragSession.value?.dragging &&
      dragSession.value.fromDayIso === cell.dayIso
    );
  }

  return {
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
  };
}
