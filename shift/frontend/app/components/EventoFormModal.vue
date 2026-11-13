<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center"
    @click.self="cerrar"
  >
    <div class="w-full max-w-lg rounded-xl border border-shift-border bg-shift-card p-6 shadow-xl">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-lg font-semibold">{{ tituloModal }}</h2>
        <button
          type="button"
          class="text-shift-muted hover:text-white"
          aria-label="Cerrar"
          @click="cerrar"
        >
          ✕
        </button>
      </div>

      <template v-if="evento && modoEdicion && soloLecturaEfectivo">
        <dl class="mt-4 space-y-2 text-sm">
          <div v-if="evento.persona">
            <dt class="text-shift-muted">Persona</dt>
            <dd>{{ evento.persona.nombre }} · legajo {{ evento.persona.legajo }}</dd>
          </div>
          <div>
            <dt class="text-shift-muted">Tipo</dt>
            <dd>{{ evento.tipoEvento.nombre }}</dd>
          </div>
          <div>
            <dt class="text-shift-muted">Fechas</dt>
            <dd>
              {{ formatFechaEvento(evento.fechaDesde) }}
              <span v-if="evento.fechaHasta.slice(0, 10) !== evento.fechaDesde.slice(0, 10)">
                → {{ formatFechaEvento(evento.fechaHasta) }}
              </span>
            </dd>
          </div>
          <div v-if="evento.creadoEn">
            <dt class="text-shift-muted">Fecha creación</dt>
            <dd>{{ formatFechaCreacion(evento.creadoEn) }}</dd>
          </div>
          <div v-if="evento.excesoCupo">
            <span class="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-200">
              Exceso de cupo
            </span>
          </div>
        </dl>
        <p v-if="soloLecturaEfectivo" class="mt-4 text-sm text-shift-muted">
          Solo lectura — evento de otra persona.
        </p>
        <p
          v-else-if="esEventoAjeno && esAdmin"
          class="mt-4 text-sm text-shift-muted"
        >
          Evento de otra persona. Como administrador podés cancelarlo.
        </p>
        <div v-if="puedeCancelar" class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-300 hover:bg-red-950"
            :disabled="guardando"
            @click="cancelarEvento"
          >
            Cancelar evento
          </button>
        </div>
      </template>

      <template v-else>
        <div
          v-if="esAdmin && !modoEdicion"
          class="mt-4 flex rounded-lg border border-shift-border p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition"
            :class="
              modo === 'evento'
                ? 'bg-shift-accent text-white'
                : 'text-shift-muted hover:text-white'
            "
            @click="modo = 'evento'"
          >
            Evento
          </button>
          <button
            type="button"
            role="tab"
            class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition"
            :class="
              modo === 'feriado'
                ? 'bg-shift-accent text-white'
                : 'text-shift-muted hover:text-white'
            "
            @click="modo = 'feriado'"
          >
            Feriado
          </button>
        </div>

        <form
          v-if="modo === 'feriado' && esAdmin && !modoEdicion"
          class="mt-4 space-y-4"
          @submit.prevent="guardarFeriado"
        >
          <p class="text-sm text-shift-muted">
            Feriado para todo el equipo. Los tipos con «bloquea feriado» no podrán cargarse ese día.
          </p>
          <div>
            <label class="mb-1 block text-sm text-shift-muted">Fecha</label>
            <input
              v-model="feriadoForm.fecha"
              type="date"
              required
              :disabled="!!feriadoExistente"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-shift-muted">Descripción (opcional)</label>
            <input
              v-model="feriadoForm.descripcion"
              type="text"
              placeholder="Ej. Día de la Independencia — si queda vacío se muestra «Feriado»"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              v-if="feriadoExistente?.activo"
              type="button"
              class="mr-auto rounded-lg border border-red-800 px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
              :disabled="guardando"
              @click="quitarFeriado"
            >
              Quitar feriado
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm text-shift-muted hover:bg-shift-border"
              @click="cerrar"
            >
              Cerrar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-shift-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              :disabled="guardando"
            >
              {{ guardando ? 'Guardando…' : feriadoExistente ? 'Guardar feriado' : 'Crear feriado' }}
            </button>
          </div>
        </form>

        <form v-else class="mt-4 space-y-4" @submit.prevent="enviar">
          <p
            v-if="diaFueraVentana"
            class="rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200"
          >
            Estás cargando fuera del período habilitado para empleados. Podés
            anotar a cualquier persona del servicio, incluido vos.
          </p>
          <p
            v-else-if="!esAdmin && tipoSeleccionado && mensajeVentana"
            class="rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200"
          >
            {{ mensajeVentana }}
          </p>
          <div>
            <label class="mb-1 block text-sm text-shift-muted">Tipo</label>
            <p
              v-if="bloquearTipo"
              class="rounded-lg border border-shift-border bg-shift-bg/50 px-3 py-2 text-sm"
            >
              {{ tipoSeleccionado?.nombre ?? '—' }}
            </p>
            <select
              v-else
              v-model.number="form.tipoEventoId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            >
              <option v-for="t in tiposActivos" :key="t.id" :value="t.id">
                {{ t.nombre }}
              </option>
            </select>
          </div>

          <div v-if="cargarParaOtros">
            <label class="mb-1 block text-sm text-shift-muted">Empleado</label>
            <select
              v-model.number="form.personaId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            >
              <option v-if="!personasOpciones.length" :value="0" disabled>
                Sin empleados activos en este servicio
              </option>
              <option v-for="p in personasOpciones" :key="p.id" :value="p.id">
                {{ p.nombre }} · {{ p.legajo }}
              </option>
            </select>
          </div>

          <div v-if="bloquearFechas" class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm text-shift-muted">Día</label>
              <p class="rounded-lg border border-shift-border bg-shift-bg/50 px-3 py-2 text-sm">
                {{ form.fechaDesde }}
              </p>
            </div>
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm text-shift-muted">Desde</label>
              <input
                v-model="form.fechaDesde"
                type="date"
                required
                :min="ventanaFechas?.min"
                :max="ventanaFechas?.max"
                class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-shift-muted">Hasta</label>
              <input
                v-model="form.fechaHasta"
                type="date"
                required
                :min="ventanaFechas?.min"
                :max="ventanaFechas?.max"
                class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <p v-if="errorDiasRango" class="text-sm text-red-400">
            {{ errorDiasRango }}
          </p>
          <p v-else-if="hintDiasRango" class="text-xs text-shift-muted">
            {{ hintDiasRango }}
          </p>

          <div>
            <label class="mb-1 block text-sm text-shift-muted">Observación (opcional)</label>
            <textarea
              v-model="form.observacion"
              rows="2"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>

          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

          <div class="flex flex-wrap justify-end gap-2">
            <button
              v-if="puedeCancelar"
              type="button"
              class="mr-auto rounded-lg border border-red-800 px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
              :disabled="guardando"
              @click="cancelarEvento"
            >
              Cancelar evento
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm text-shift-muted hover:bg-shift-border"
              @click="cerrar"
            >
              Cerrar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-shift-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              :disabled="guardando || !!errorDiasRango"
            >
              {{ guardando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Confirmar' }}
            </button>
          </div>
        </form>
      </template>

      <ExcesoCupoDialog
        :open="excesoOpen"
        :advertencias="excesoAdvertencias"
        :permite-exceso-cupo="tipoSeleccionado?.permiteExcesoCupo ?? false"
        @cancel="excesoOpen = false"
        @confirm="confirmarExceso"
      />

      <ShiftConfirmDialog
        :open="confirmCancelarOpen"
        titulo="Cancelar evento"
        :mensaje="mensajeConfirmCancelar"
        etiqueta-confirmar="Sí, cancelar evento"
        etiqueta-cancelar="Volver"
        variante="danger"
        @cancel="confirmCancelarOpen = false"
        @confirm="ejecutarCancelarEvento"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Evento, Feriado, Persona, ReglaMensaje, TipoEvento, ValidacionEvento } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';
import {
  currentMonthKeyArgentina,
  mensajeVentanaTemporal,
  aplicarAnticipacionMinima,
  ventanaFechasIso,
} from '~/utils/fechas';
import {
  errorDiasRangoTipo,
  hintDiasRangoTipo,
} from '~/utils/rango-dias-reglas';

const props = defineProps<{
  open: boolean;
  tipos: TipoEvento[];
  evento?: Evento | null;
  dayIso?: string;
  soloLectura?: boolean;
  tipoInicialId?: number | null;
  feriadoExistente?: Feriado | null;
  /** Alta/edición desde calendario: tipo fijado por pestaña; fechas fijas si el tipo es de un solo día. */
  contextoCalendario?: boolean;
  /** Servicio visible en calendario (feriados propios del servicio). */
  servicioIdCalendario?: number | null;
  /** Alta admin: elegir empleado (propio o ajeno). */
  cargarParaOtros?: boolean;
  /** El día elegido cae fuera de la ventana habilitada para empleados. */
  diaFueraVentana?: boolean;
  personasServicio?: Persona[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const { api } = useApi();
const personaStore = usePersonaStore();

const modo = ref<'evento' | 'feriado'>('evento');
const form = reactive({
  tipoEventoId: 0,
  fechaDesde: '',
  fechaHasta: '',
  observacion: '',
  personaId: 0,
});
const feriadoForm = reactive({
  fecha: '',
  descripcion: '',
});

const guardando = ref(false);
const error = ref('');
const excesoOpen = ref(false);
const excesoAdvertencias = ref<ReglaMensaje[]>([]);
const pendienteExceso = ref(false);
const confirmCancelarOpen = ref(false);

const esAdmin = computed(() => personaStore.isAdmin);
const modoEdicion = computed(() => !!props.evento);
const esEventoAjeno = computed(
  () =>
    !!props.evento &&
    !!personaStore.persona &&
    props.evento.personaId !== personaStore.persona.id,
);

/** Admin siempre puede cancelar; USER solo eventos propios (ignora soloLectura del padre si es admin). */
const soloLecturaEfectivo = computed(() => {
  if (esAdmin.value) return false;
  if (!props.evento || !personaStore.persona) return !!props.soloLectura;
  return esEventoAjeno.value || !!props.soloLectura;
});

const puedeEditar = computed(
  () => props.evento?.estado === 'ACTIVO' && !soloLecturaEfectivo.value,
);

const puedeCancelar = computed(
  () => props.evento?.estado === 'ACTIVO' && !soloLecturaEfectivo.value,
);

const tiposActivos = computed(() => props.tipos.filter((t) => t.activo));

const tipoSeleccionado = computed(() =>
  props.tipos.find((t) => t.id === form.tipoEventoId),
);

const bloquearTipo = computed(() => !!props.contextoCalendario);

const bloquearFechas = computed(
  () => bloquearTipo.value && !tipoSeleccionado.value?.permiteCargaPorRango,
);

const esCargaPorRango = computed(
  () => !!tipoSeleccionado.value?.permiteCargaPorRango,
);

const mesCorriente = computed(() => currentMonthKeyArgentina());

const aplicaVentanaEnModal = computed(() => {
  if (props.diaFueraVentana) return false;
  return !esAdmin.value || !!props.contextoCalendario;
});

const personasOpciones = computed(() =>
  (props.personasServicio ?? []).filter((p) => p.activo),
);

function defaultPersonaId(): number {
  const yo = personaStore.persona?.id;
  if (yo && personasOpciones.value.some((p) => p.id === yo)) return yo;
  return personasOpciones.value[0]?.id ?? yo ?? 0;
}

function formatFechaEvento(iso: string): string {
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) return day;
  return `${d}/${m}/${y}`;
}

function formatFechaCreacion(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const ventanaFechas = computed(() => {
  if (!aplicaVentanaEnModal.value || !tipoSeleccionado.value) return null;
  const t = tipoSeleccionado.value;
  const base = ventanaFechasIso(
    mesCorriente.value,
    t.mesMinOffsetUser ?? 0,
    t.mesMaxOffsetUser ?? null,
  );
  if (esAdmin.value) return base;
  return aplicarAnticipacionMinima(base);
});

const mensajeVentana = computed(() => {
  if (!aplicaVentanaEnModal.value || !tipoSeleccionado.value) return '';
  const t = tipoSeleccionado.value;
  return mensajeVentanaTemporal(
    mesCorriente.value,
    t.mesMinOffsetUser ?? 0,
    t.mesMaxOffsetUser ?? null,
  );
});

const tituloModal = computed(() => {
  const nombre = tipoSeleccionado.value?.nombre;
  if (puedeEditar.value) {
    return nombre ? `Editar ${nombre}` : 'Editar evento';
  }
  if (modoEdicion.value) return 'Evento';
  if (modo.value === 'feriado' && esAdmin.value) return 'Feriado';
  return nombre ? `Nuevo ${nombre}` : 'Nuevo evento';
});

const errorDiasRango = computed(() =>
  errorDiasRangoTipo(tipoSeleccionado.value, form.fechaDesde, form.fechaHasta),
);

const hintDiasRango = computed(() => hintDiasRangoTipo(tipoSeleccionado.value));

const mensajeConfirmCancelar = computed(() => {
  if (!props.evento) return '';
  const tipo = props.evento.tipoEvento.nombre;
  const fecha = props.evento.fechaDesde.slice(0, 10);
  if (esEventoAjeno.value) {
    const nombre = props.evento.persona?.nombre ?? 'otra persona';
    return `¿Cancelar el evento de ${nombre} (${tipo})?`;
  }
  return `¿Cancelar tu evento de ${tipo} del ${fecha}? Esta acción no se puede deshacer.`;
});

watch(
  () =>
    [
      props.open,
      props.dayIso,
      props.tipos,
      props.tipoInicialId,
      props.feriadoExistente,
      props.evento,
      props.cargarParaOtros,
      props.personasServicio,
    ] as const,
  ([open]) => {
    if (!open) return;
    error.value = '';
    excesoOpen.value = false;
    pendienteExceso.value = false;
    confirmCancelarOpen.value = false;

    if (props.evento) {
      modo.value = 'evento';
      form.tipoEventoId = props.evento.tipoEventoId;
      form.fechaDesde = props.evento.fechaDesde.slice(0, 10);
      form.fechaHasta = props.evento.fechaHasta.slice(0, 10);
      form.observacion = props.evento.observacion ?? '';
      form.personaId = props.evento.personaId;
      return;
    }

    const day = props.dayIso ?? new Date().toISOString().slice(0, 10);

    if (props.feriadoExistente?.activo) {
      modo.value = 'feriado';
      feriadoForm.fecha = props.feriadoExistente.fecha.slice(0, 10);
      feriadoForm.descripcion = props.feriadoExistente.descripcion;
    } else {
      modo.value = 'evento';
      feriadoForm.fecha = day;
      feriadoForm.descripcion = '';
    }

    const porTipo = props.tipoInicialId
      ? props.tipos.find((t) => t.id === props.tipoInicialId)
      : undefined;
    const ho = props.tipos.find((t) => t.codigo === 'HOME_OFFICE') ?? props.tipos[0];
    form.tipoEventoId =
      props.contextoCalendario && porTipo
        ? porTipo.id
        : porTipo?.id ?? ho?.id ?? 0;
    form.fechaDesde = day;
    form.fechaHasta = day;
    form.observacion = '';
    form.personaId = defaultPersonaId();
  },
  { immediate: true },
);

watch(
  () => form.fechaDesde,
  (desde) => {
    if (bloquearFechas.value || !esCargaPorRango.value) {
      form.fechaHasta = desde;
    }
  },
);

watch(
  () => [props.tipoInicialId, props.contextoCalendario, props.open] as const,
  ([tipoId, ctx, open]) => {
    if (!open || !ctx || !tipoId) return;
    form.tipoEventoId = tipoId;
  },
);

function cerrar() {
  emit('close');
}

async function guardarFeriado() {
  guardando.value = true;
  error.value = '';
  try {
    if (props.feriadoExistente) {
      await api(`/feriados/${props.feriadoExistente.id}`, {
        method: 'PATCH',
        body: { descripcion: feriadoForm.descripcion.trim() },
      });
    } else {
      const desc = feriadoForm.descripcion.trim();
      await api('/feriados', {
        method: 'POST',
        body: {
          fecha: feriadoForm.fecha,
          ...(desc ? { descripcion: desc } : {}),
          ...(personaStore.isSuperAdmin || !props.servicioIdCalendario
            ? {}
            : { servicioId: props.servicioIdCalendario }),
        },
      });
    }
    emit('saved');
    cerrar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function quitarFeriado() {
  if (!props.feriadoExistente) return;
  guardando.value = true;
  error.value = '';
  try {
    await api(`/feriados/${props.feriadoExistente.id}`, {
      method: 'PATCH',
      body: { activo: false },
    });
    emit('saved');
    cerrar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function enviar() {
  if (!personaStore.persona) return;
  error.value = '';
  const personaId = props.cargarParaOtros
    ? form.personaId
    : personaStore.persona.id;
  if (!personaId) {
    error.value = 'Elegí un empleado.';
    return;
  }
  const errVac = errorDiasRango.value;
  if (errVac) {
    error.value = errVac;
    return;
  }
  guardando.value = true;
  try {
    const datosEvento = {
      tipoEventoId: form.tipoEventoId,
      fechaDesde: form.fechaDesde,
      fechaHasta: form.fechaHasta,
    };

    if (!pendienteExceso.value) {
      const validacion = await api<ValidacionEvento>('/eventos/validar', {
        method: 'POST',
        body: {
          personaId,
          ...datosEvento,
          ...(props.evento ? { eventoId: props.evento.id } : {}),
        },
      });

      if (!validacion.permitido) {
        error.value =
          validacion.errores.map((e) => e.mensaje).join(' ') ||
          (props.evento ? 'No se puede guardar el evento' : 'No se puede crear el evento');
        return;
      }

      if (validacion.excesoCupo && validacion.advertencias.length > 0) {
        if (!tipoSeleccionado.value?.permiteExcesoCupo) {
          error.value = validacion.advertencias.map((a) => a.mensaje).join(' ');
          return;
        }
        excesoAdvertencias.value = validacion.advertencias;
        excesoOpen.value = true;
        return;
      }
    }

    const observacion = form.observacion || undefined;
    const confirmarExcesoCupo = pendienteExceso.value || undefined;

    if (props.evento) {
      await api(`/eventos/${props.evento.id}`, {
        method: 'PATCH',
        body: {
          ...(bloquearTipo.value ? {} : { tipoEventoId: datosEvento.tipoEventoId }),
          ...(bloquearFechas.value
            ? {}
            : {
                fechaDesde: datosEvento.fechaDesde,
                fechaHasta: datosEvento.fechaHasta,
              }),
          observacion,
          confirmarExcesoCupo,
        },
      });
    } else {
      await api('/eventos', {
        method: 'POST',
        body: {
          ...datosEvento,
          personaId,
          observacion,
          confirmarExcesoCupo,
        },
      });
    }
    emit('saved');
    cerrar();
  } catch (e: unknown) {
    const err = e as { data?: { codigo?: string; advertencias?: ReglaMensaje[] } };
    if (err.data?.codigo === 'EXCESO_CUPO' && err.data.advertencias?.length) {
      excesoAdvertencias.value = err.data.advertencias;
      excesoOpen.value = true;
      return;
    }
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function confirmarExceso() {
  excesoOpen.value = false;
  pendienteExceso.value = true;
  await enviar();
  pendienteExceso.value = false;
}

function cancelarEvento() {
  if (!props.evento) return;
  confirmCancelarOpen.value = true;
}

async function ejecutarCancelarEvento() {
  if (!props.evento) return;
  confirmCancelarOpen.value = false;
  guardando.value = true;
  error.value = '';
  try {
    await api(`/eventos/${props.evento.id}/cancelar`, { method: 'POST' });
    emit('saved');
    cerrar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}
</script>
