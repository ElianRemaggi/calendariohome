<template>
  <div :class="chatAbierto && servicioSeleccionadoId ? 'xl:pr-[22rem]' : ''">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <h1 class="min-w-0 flex-1 truncate text-2xl font-semibold sm:text-3xl">
        {{ tituloCalendario }}
      </h1>
      <select
        v-if="tipos.length"
        :value="tipoSeleccionadoId ?? ''"
        class="max-w-[14rem] shrink-0 rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
        aria-label="Tipo de evento"
        @change="onTipoSelectChange"
      >
        <option
          v-for="t in tipos"
          :key="t.id"
          :value="t.id"
        >
          {{ t.nombre }}
        </option>
      </select>
      <button
        v-if="servicioSeleccionadoId && !chatAbierto"
        type="button"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-shift-border bg-shift-card text-shift-muted transition hover:border-shift-accent/50 hover:text-shift-accent"
        aria-label="Comentarios del mes"
        :aria-expanded="false"
        @click="chatAbierto = !chatAbierto"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          />
        </svg>
      </button>
    </div>

    <div
      v-if="personaStore.isAdmin && servicios.length > 1"
      class="mb-4 flex flex-wrap items-center gap-2"
    >
      <span class="text-xs font-medium text-shift-muted">Servicio:</span>
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Servicio">
        <button
          v-for="s in servicios"
          :key="s.id"
          type="button"
          role="tab"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
          :class="
            servicioSeleccionadoId === s.id
              ? 'border-shift-accent bg-shift-accent/15 text-shift-accent'
              : 'border-shift-border bg-shift-card text-shift-muted hover:border-shift-accent/40'
          "
          :aria-selected="servicioSeleccionadoId === s.id"
          @click="seleccionarServicio(s.id)"
        >
          {{ s.nombre }}
        </button>
      </div>
    </div>

    <div ref="calendarioContenedorRef">
      <p v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</p>
      <p v-if="cargando || guardandoMovimiento" class="text-sm text-shift-muted">
        {{ guardandoMovimiento ? 'Moviendo evento…' : 'Cargando…' }}
      </p>

      <ShiftCalendarMonth
        v-else
        :month="mesActual"
        :eventos="eventos"
        :feriados="feriadosLabels"
        :hide-weekends="ocultarFinesDeSemana"
        :ventana-fechas="ventanaFechasCalendario"
        :dias-periodo-cerrado="diasPeriodoCerrado"
        :permitir-clic-periodo-cerrado="personaStore.isAdmin"
        :permitir-clic-fuera-ventana="personaStore.isAdmin"
        :persona-ids-ordenados="personaIdsEnVista"
        :habilitar-arrastre="habilitarArrastreHo"
        :persona-id-actual="personaStore.persona?.id"
        @prev="cambiarMes(-1)"
        @next="cambiarMes(1)"
        @select-day="abrirNuevo"
        @select-evento="abrirEvento"
        @mover-evento="moverEvento"
      />
    </div>

    <ShiftChatPanel
      v-if="servicioSeleccionadoId && chatAbierto"
      v-model:abierto="chatAbierto"
      :month="mesActual"
      :servicio-id="servicioSeleccionadoId"
      :servicio-nombre="servicioSeleccionado?.nombre"
    />

    <EventoFormModal
      :open="modalOpen"
      :tipos="tipos"
      :day-iso="diaSeleccionado"
      :evento="eventoSeleccionado"
      :feriado-existente="feriadoDelDia"
      :solo-lectura="soloLecturaModal"
      :tipo-inicial-id="tipoSeleccionadoId"
      contexto-calendario
      :servicio-id-calendario="servicioSeleccionadoId"
      :cargar-para-otros="cargarParaOtros"
      :dia-fuera-ventana="diaFueraVentana"
      :personas-servicio="personasServicio"
      @close="cerrarModal"
      @saved="recargar"
    />

    <ShiftMoverEventoDialog
      :open="confirmMoverOpen"
      :titulo="tituloMoverDialog"
      :mensaje-principal="mensajeMoverDialog"
      :aviso-exceso-cupo="avisoExcesoMoverDialog"
      :guardando="guardandoMovimiento"
      @cancel="cancelarConfirmMover"
      @confirm="confirmarTrasladoMover"
    />
  </div>
</template>

<script setup lang="ts">
import type { Evento, Feriado, PeriodoBloqueo, Persona, Servicio, TipoEvento, ValidacionEvento } from '~/types';
import {
  addMonths,
  calendarGridRange,
  currentMonthKey,
  currentMonthKeyArgentina,
  dayIsoEnVentana,
  eachDayInRange,
  feriadoKey,
  formatDayShort,
  mensajeVentanaTemporal,
  aplicarAnticipacionMinima,
  ventanaFechasIso,
} from '~/utils/fechas';
import { apiErrorMessage } from '~/utils/api-error';

definePageMeta({ layout: 'calendario' });

const { api } = useApi();
const personaStore = usePersonaStore();

const mesActual = ref(currentMonthKey());
const tipoSeleccionadoId = ref<number | null>(null);
const servicioSeleccionadoId = ref<number | null>(null);
const servicios = ref<Servicio[]>([]);
const personasServicio = ref<Persona[]>([]);
const eventos = ref<Evento[]>([]);
const tipos = ref<TipoEvento[]>([]);
const feriadosList = ref<Feriado[]>([]);
const periodosBloqueo = ref<PeriodoBloqueo[]>([]);
const cargando = ref(true);
const guardandoMovimiento = ref(false);
const error = ref('');
const confirmMoverOpen = ref(false);
const pendienteMover = ref<{
  evento: Evento;
  dayIso: string;
  confirmarExcesoCupo: boolean;
} | null>(null);
const chatAbierto = ref(false);
const calendarioContenedorRef = ref<HTMLElement | null>(null);
const { ocultarFinesDeSemana } = useCalendarCompact(
  calendarioContenedorRef,
  chatAbierto,
);

const modalOpen = ref(false);
const diaSeleccionado = ref<string | undefined>();
const eventoSeleccionado = ref<Evento | null>(null);
const soloLecturaModal = ref(false);

const tipoSeleccionado = computed(() =>
  tipos.value.find((t) => t.id === tipoSeleccionadoId.value),
);

const mesReferenciaVentana = computed(() => currentMonthKeyArgentina());

const personaIdsEnVista = computed(() => {
  const ids = new Set<number>();
  for (const e of eventos.value) {
    if (e.estado === 'ACTIVO') ids.add(e.personaId);
  }
  return [...ids].sort((a, b) => a - b);
});

const ventanaFechasCalendario = computed(() => {
  const t = tipoSeleccionado.value;
  if (!t) return null;
  const base = ventanaFechasIso(
    mesReferenciaVentana.value,
    t.mesMinOffsetUser ?? 0,
    t.mesMaxOffsetUser ?? null,
  );
  // USER: mínimo mañana (anticipación ≥ 1 día). Admin conserva solo R6.
  if (personaStore.isAdmin) return base;
  return aplicarAnticipacionMinima(base);
});

/** Alta admin: siempre puede anotar a cualquier persona del servicio. */
const cargarParaOtros = computed(() => {
  if (!personaStore.isAdmin || eventoSeleccionado.value) return false;
  return !!diaSeleccionado.value;
});

/** Día fuera de la ventana R6: el modal avisa y no limita las fechas. */
const diaFueraVentana = computed(() => {
  if (!diaSeleccionado.value || !ventanaFechasCalendario.value) return false;
  return !dayIsoEnVentana(diaSeleccionado.value, ventanaFechasCalendario.value);
});

/** Días ISO del tipo+servicio actual cubiertos por un período cerrado activo. */
const diasPeriodoCerrado = computed(() => {
  const days: string[] = [];
  for (const b of periodosBloqueo.value) {
    if (!b.activo) continue;
    days.push(...eachDayInRange(b.fechaDesde.slice(0, 10), b.fechaHasta.slice(0, 10)));
  }
  return days;
});

function diaEnPeriodoCerrado(dayIso: string): boolean {
  return diasPeriodoCerrado.value.includes(dayIso);
}

/** Solo eventos de un día (HO): arrastre dentro del mes visible. */
const habilitarArrastreHo = computed(
  () => !!tipoSeleccionado.value && !tipoSeleccionado.value.permiteCargaPorRango,
);

const servicioSeleccionado = computed(() =>
  servicios.value.find((s) => s.id === servicioSeleccionadoId.value),
);

const tituloCalendario = computed(() => {
  const tipo = tipoSeleccionado.value?.nombre ?? 'Calendario';
  const servicio =
    servicioSeleccionado.value?.nombre ??
    personaStore.persona?.servicio?.nombre ??
    '';
  return servicio ? `${tipo} ${servicio}` : tipo;
});

const feriadosLabels = computed((): Record<string, string> => {
  const labels: Record<string, string> = {};
  for (const f of feriadosList.value) {
    if (!f.activo) continue;
    const key = feriadoKey(f.fecha);
    const desc = f.descripcion?.trim();
    labels[key] = desc || 'Feriado';
  }
  return labels;
});

const feriadoDelDia = computed(() => {
  if (!diaSeleccionado.value) return null;
  return (
    feriadosList.value.find(
      (f) => f.activo && feriadoKey(f.fecha) === diaSeleccionado.value,
    ) ?? null
  );
});

function initServicioSeleccionado() {
  const propio = personaStore.persona?.servicioId;
  if (propio && servicios.value.some((s) => s.id === propio)) {
    servicioSeleccionadoId.value = propio;
  } else if (servicios.value.length) {
    servicioSeleccionadoId.value = servicios.value[0]!.id;
  }
}

async function cargarPersonasServicio() {
  if (!personaStore.isAdmin || !servicioSeleccionadoId.value) {
    personasServicio.value = [];
    return;
  }
  const detalle = await api<Servicio & { personas?: Persona[] }>(
    `/servicios/${servicioSeleccionadoId.value}`,
  );
  personasServicio.value = (detalle.personas ?? []).filter((p) => p.activo);
}

async function cargarServicios() {
  if (personaStore.isAdmin) {
    servicios.value = await api<Servicio[]>('/servicios?activo=true');
  } else if (personaStore.persona?.servicio) {
    servicios.value = [personaStore.persona.servicio];
  }
  initServicioSeleccionado();
}

async function cargarTipos() {
  tipos.value = await api<TipoEvento[]>('/tipos-evento?activo=true');
  if (!tipoSeleccionadoId.value && tipos.value.length) {
    const ho = tipos.value.find((t) => t.codigo === 'HOME_OFFICE') ?? tipos.value[0];
    tipoSeleccionadoId.value = ho!.id;
  }
}

async function cargarDatos() {
  if (!tipoSeleccionadoId.value || !servicioSeleccionadoId.value) return;
  cargando.value = true;
  error.value = '';
  const { desde, hasta } = calendarGridRange(mesActual.value);
  const years = [...new Set([desde.slice(0, 4), hasta.slice(0, 4)])];
  try {
    const [ev, bloqueos, ...feriadosPorAnio] = await Promise.all([
      api<Evento[]>(
        `/eventos?month=${mesActual.value}&tipoEventoId=${tipoSeleccionadoId.value}&servicioId=${servicioSeleccionadoId.value}&desde=${desde}&hasta=${hasta}`,
      ),
      api<PeriodoBloqueo[]>(
        `/periodos-bloqueo?servicioId=${servicioSeleccionadoId.value}&tipoEventoId=${tipoSeleccionadoId.value}&soloActivos=true`,
      ),
      ...years.map((y) =>
        api<Feriado[]>(
          `/feriados?year=${y}&servicioId=${servicioSeleccionadoId.value}`,
        ),
      ),
    ]);
    eventos.value = ev;
    periodosBloqueo.value = bloqueos;
    feriadosList.value = feriadosPorAnio.flat();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargando.value = false;
  }
}

function seleccionarTipo(id: number) {
  tipoSeleccionadoId.value = id;
  cargarDatos();
}

function onTipoSelectChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value);
  if (Number.isInteger(id)) seleccionarTipo(id);
}

function seleccionarServicio(id: number) {
  servicioSeleccionadoId.value = id;
  cargarPersonasServicio();
  cargarDatos();
}

function cambiarMes(delta: number) {
  mesActual.value = addMonths(mesActual.value, delta);
  cargarDatos();
}

function abrirNuevo(day?: string) {
  if (
    day &&
    !personaStore.isAdmin &&
    ventanaFechasCalendario.value &&
    !dayIsoEnVentana(day, ventanaFechasCalendario.value)
  ) {
    const t = tipoSeleccionado.value;
    error.value = t
      ? mensajeVentanaTemporal(
          mesReferenciaVentana.value,
          t.mesMinOffsetUser ?? 0,
          t.mesMaxOffsetUser ?? null,
        )
      : 'Fecha fuera del período permitido para este tipo de evento.';
    return;
  }
  if (day && diaEnPeriodoCerrado(day) && !personaStore.isAdmin) {
    error.value =
      'Este período está cerrado para esta novedad. Solo un administrador puede modificarlo.';
    return;
  }
  if (day) {
    diaSeleccionado.value = day;
  }
  eventoSeleccionado.value = null;
  soloLecturaModal.value = false;
  modalOpen.value = true;
}

function abrirEvento(ev: Evento) {
  eventoSeleccionado.value = ev;
  diaSeleccionado.value = ev.fechaDesde.slice(0, 10);
  const esAjeno =
    !!personaStore.persona && ev.personaId !== personaStore.persona.id;
  const cerradoPropio =
    !personaStore.isAdmin &&
    diaEnPeriodoCerrado(ev.fechaDesde.slice(0, 10));
  soloLecturaModal.value = (esAjeno && !personaStore.isAdmin) || cerradoPropio;
  modalOpen.value = true;
}

function cerrarModal() {
  modalOpen.value = false;
  eventoSeleccionado.value = null;
  soloLecturaModal.value = false;
}

async function recargar() {
  await cargarDatos();
}

const tituloMoverDialog = computed(() => {
  const nombre = pendienteMover.value?.evento.tipoEvento.nombre ?? 'evento';
  return `Mover ${nombre}`;
});

const mensajeMoverDialog = computed(() => {
  const p = pendienteMover.value;
  if (!p) return '';
  const tipo = p.evento.tipoEvento.nombre;
  const origen = formatDayShort(p.evento.fechaDesde.slice(0, 10));
  const destino = formatDayShort(p.dayIso);
  return `Vas a cancelar tu ${tipo} del ${origen} y dar de alta uno nuevo el ${destino}.`;
});

const avisoExcesoMoverDialog = computed(() => {
  const p = pendienteMover.value;
  if (!p?.confirmarExcesoCupo) return '';
  return 'El día destino tiene el cupo recomendado completo: el nuevo evento quedará marcado como exceso de cupo.';
});

async function ejecutarTrasladoCancelarAlta(
  evento: Evento,
  dayIso: string,
  confirmarExcesoCupo: boolean,
) {
  const origenLabel = formatDayShort(evento.fechaDesde.slice(0, 10));
  const destinoLabel = formatDayShort(dayIso);
  guardandoMovimiento.value = true;
  error.value = '';
  try {
    await api(`/eventos/${evento.id}/cancelar`, { method: 'POST' });
    try {
      await api('/eventos', {
        method: 'POST',
        body: {
          tipoEventoId: evento.tipoEventoId,
          fechaDesde: dayIso,
          fechaHasta: dayIso,
          ...(evento.observacion?.trim()
            ? { observacion: evento.observacion.trim() }
            : {}),
          ...(confirmarExcesoCupo ? { confirmarExcesoCupo: true } : {}),
        },
      });
    } catch (createErr: unknown) {
      error.value =
        `Se canceló tu evento del ${origenLabel}, pero no se pudo dar de alta el del ${destinoLabel}. ` +
        `${apiErrorMessage(createErr)} Podés cargarlo manualmente en ese día.`;
      await recargar();
      return;
    }
    await recargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardandoMovimiento.value = false;
  }
}

async function moverEvento(evento: Evento, dayIso: string) {
  if (guardandoMovimiento.value) return;
  const origen = evento.fechaDesde.slice(0, 10);
  if (origen === dayIso) return;

  error.value = '';
  try {
    const validacion = await api<ValidacionEvento>('/eventos/validar', {
      method: 'POST',
      body: {
        personaId: evento.personaId,
        tipoEventoId: evento.tipoEventoId,
        fechaDesde: dayIso,
        fechaHasta: dayIso,
      },
    });

    if (!validacion.permitido) {
      error.value =
        validacion.errores.map((e) => e.mensaje).join(' ') ||
        'No se puede mover el evento a ese día.';
      return;
    }

    if (validacion.excesoCupo && validacion.advertencias.length > 0) {
      if (!evento.tipoEvento.permiteExcesoCupo) {
        error.value = validacion.advertencias.map((a) => a.mensaje).join(' ');
        return;
      }
    }

    pendienteMover.value = {
      evento,
      dayIso,
      confirmarExcesoCupo:
        validacion.excesoCupo && validacion.advertencias.length > 0,
    };
    confirmMoverOpen.value = true;
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  }
}

function cancelarConfirmMover() {
  confirmMoverOpen.value = false;
  pendienteMover.value = null;
}

async function confirmarTrasladoMover() {
  const p = pendienteMover.value;
  if (!p) return;
  confirmMoverOpen.value = false;
  const { evento, dayIso, confirmarExcesoCupo } = p;
  pendienteMover.value = null;
  await ejecutarTrasladoCancelarAlta(evento, dayIso, confirmarExcesoCupo);
}

const CHAT_STORAGE_KEY = 'shift-chat-abierto';

onMounted(async () => {
  if (import.meta.client && sessionStorage.getItem(CHAT_STORAGE_KEY) === '1') {
    chatAbierto.value = true;
  }
  try {
    await Promise.all([cargarServicios(), cargarTipos()]);
    await cargarPersonasServicio();
    await cargarDatos();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
    cargando.value = false;
  }
});

watch(chatAbierto, (open) => {
  if (!import.meta.client) return;
  sessionStorage.setItem(CHAT_STORAGE_KEY, open ? '1' : '0');
});
</script>
