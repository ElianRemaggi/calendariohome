<template>
  <AdminShell>
    <div class="space-y-8">
      <div class="rounded-xl border border-shift-border bg-shift-card p-8">
        <h2 class="text-lg font-semibold">Exportaciones RRHH</h2>
        <p class="mt-2 text-sm text-shift-muted">
          Planilla con columnas FECHA, LEGAJO, APELLIDO Y NOMBRE, FUNCION, SERVICIO y MOTIVO.
          Solo eventos activos del tipo y período seleccionados.
        </p>

        <form class="mt-6 space-y-5" @submit.prevent="descargar">
          <div v-if="!personaStore.isSuperAdmin || servicios.length" class="max-w-md">
            <label class="mb-1 block text-xs text-shift-muted">Servicio</label>
            <select
              v-model.number="servicioId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              :disabled="!personaStore.isSuperAdmin && servicios.length <= 1"
            >
              <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>

          <div class="max-w-md">
            <label class="mb-1 block text-xs text-shift-muted">Tipo de evento</label>
            <select
              v-model.number="tipoEventoId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              :disabled="cargandoTipos || !tipos.length"
            >
              <option v-if="!tipos.length" :value="0">Sin tipos disponibles</option>
              <option v-for="t in tipos" :key="t.id" :value="t.id">
                {{ t.nombre }}
              </option>
            </select>
          </div>

          <fieldset>
            <legend class="mb-2 text-xs font-medium text-shift-muted">Período</legend>
            <div class="flex flex-wrap gap-4">
              <label class="flex cursor-pointer items-center gap-2 text-sm">
                <input v-model="modo" type="radio" value="mes" />
                Mes completo
              </label>
              <label class="flex cursor-pointer items-center gap-2 text-sm">
                <input v-model="modo" type="radio" value="liquidacion" />
                Período de liquidación
              </label>
              <label class="flex cursor-pointer items-center gap-2 text-sm">
                <input v-model="modo" type="radio" value="rango" />
                Rango personalizado
              </label>
            </div>
          </fieldset>

          <div v-if="modo === 'mes' || modo === 'liquidacion'" class="max-w-xs">
            <label class="mb-1 block text-xs text-shift-muted">
              {{
                modo === 'liquidacion'
                  ? 'Mes de cierre (día 15)'
                  : 'Mes calendario'
              }}
            </label>
            <input
              v-model="mes"
              type="month"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
            <p v-if="modo === 'liquidacion'" class="mt-1 text-xs text-shift-muted">
              Del 16 del mes anterior al 15 de este mes (ej. mayo 2026 → 16/04/2026–15/05/2026).
            </p>
          </div>

          <div v-else class="flex flex-wrap gap-4">
            <div>
              <label class="mb-1 block text-xs text-shift-muted">Desde</label>
              <input
                v-model="fechaDesde"
                type="date"
                required
                class="rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-shift-muted">Hasta</label>
              <input
                v-model="fechaHasta"
                type="date"
                required
                class="rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label class="flex cursor-pointer items-start gap-2 text-sm">
            <input v-model="bloquearAlExportar" type="checkbox" class="mt-1" />
            <span>
              Descargar y bloquear período
              <span class="block text-xs text-shift-muted">
                Tras descargar, cierra la edición para empleados: del 1 al 15 del mes
                seleccionado (o el rango personalizado). Los admins pueden seguir corrigiendo.
              </span>
            </span>
          </label>

          <button
            type="submit"
            class="rounded-lg bg-shift-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            :disabled="descargando || !tipoEventoId || !servicioId"
          >
            {{
              descargando
                ? 'Generando…'
                : bloquearAlExportar
                  ? 'Descargar Excel y bloquear'
                  : 'Descargar Excel'
            }}
          </button>
        </form>

        <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>
        <p v-if="exito" class="mt-4 text-sm text-emerald-400">{{ exito }}</p>
      </div>

      <div class="rounded-xl border border-shift-border bg-shift-card p-8">
        <h2 class="text-lg font-semibold">Bloquear calendario</h2>
        <p class="mt-2 text-sm text-shift-muted">
          Impide que los empleados creen, editen o cancelen una novedad en el rango indicado.
          Por defecto: del 1 al 15 del mes actual. Los administradores no quedan bloqueados.
        </p>

        <form class="mt-6 flex flex-wrap items-end gap-4" @submit.prevent="crearBloqueo">
          <div class="min-w-[10rem]">
            <label class="mb-1 block text-xs text-shift-muted">Servicio</label>
            <select
              v-model.number="bloqueoServicioId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              :disabled="!personaStore.isSuperAdmin && servicios.length <= 1"
            >
              <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div class="min-w-[10rem]">
            <label class="mb-1 block text-xs text-shift-muted">Novedad</label>
            <select
              v-model.number="bloqueoTipoId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            >
              <option v-for="t in tipos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Desde</label>
            <input
              v-model="bloqueoDesde"
              type="date"
              required
              class="rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Hasta</label>
            <input
              v-model="bloqueoHasta"
              type="date"
              required
              class="rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            class="rounded-lg bg-shift-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            :disabled="bloqueando || !bloqueoTipoId || !bloqueoServicioId"
          >
            {{ bloqueando ? 'Guardando…' : 'Bloquear período' }}
          </button>
        </form>
        <p v-if="errorBloqueo" class="mt-3 text-sm text-red-400">{{ errorBloqueo }}</p>

        <div class="mt-6">
          <h3 class="text-sm font-medium text-shift-muted">Bloqueos activos</h3>
          <p v-if="!bloqueos.length" class="mt-2 text-sm text-shift-muted">
            No hay períodos bloqueados.
          </p>
          <ul v-else class="mt-3 divide-y divide-shift-border rounded-lg border border-shift-border">
            <li
              v-for="b in bloqueos"
              :key="b.id"
              class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <span class="font-medium">{{ b.tipoEvento.nombre }}</span>
                <span class="text-shift-muted"> · {{ b.servicio.nombre }}</span>
                <div class="text-xs text-shift-muted">
                  {{ formatFechaUi(b.fechaDesde) }} – {{ formatFechaUi(b.fechaHasta) }}
                  <span v-if="b.motivo"> · {{ b.motivo }}</span>
                </div>
              </div>
              <button
                type="button"
                class="rounded-lg border border-shift-border px-3 py-1.5 text-xs hover:bg-shift-bg disabled:opacity-50"
                :disabled="desactivandoId === b.id"
                @click="desactivarBloqueo(b.id)"
              >
                {{ desactivandoId === b.id ? '…' : 'Desbloquear' }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { PeriodoBloqueo, Servicio, TipoEvento } from '~/types';
import { currentMonthKey } from '~/utils/fechas';
import { apiErrorMessage } from '~/utils/api-error';

definePageMeta({ layout: 'default' });
useAdminPage();

const { api, apiBase } = useApi();
const personaStore = usePersonaStore();

type ModoExport = 'mes' | 'liquidacion' | 'rango';

const servicios = ref<Servicio[]>([]);
const servicioId = ref(0);
const tipos = ref<TipoEvento[]>([]);
const cargandoTipos = ref(true);
const tipoEventoId = ref(0);
const modo = ref<ModoExport>('mes');
const mes = ref(currentMonthKey());
const fechaDesde = ref('');
const fechaHasta = ref('');
const bloquearAlExportar = ref(false);
const descargando = ref(false);
const error = ref('');
const exito = ref('');

const bloqueoServicioId = ref(0);
const bloqueoTipoId = ref(0);
const bloqueoDesde = ref('');
const bloqueoHasta = ref('');
const bloqueando = ref(false);
const errorBloqueo = ref('');
const bloqueos = ref<PeriodoBloqueo[]>([]);
const desactivandoId = ref<number | null>(null);

function formatFechaUi(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}

function buildQuery(): string {
  const params = new URLSearchParams();
  params.set('modo', modo.value);
  params.set('tipoEventoId', String(tipoEventoId.value));
  if (modo.value === 'mes' || modo.value === 'liquidacion') {
    const month = mes.value.length === 7 ? mes.value : mes.value.slice(0, 7);
    params.set('month', month);
  } else {
    params.set('fechaDesde', fechaDesde.value);
    params.set('fechaHasta', fechaHasta.value);
  }
  if (servicioId.value > 0) {
    params.set('servicioId', String(servicioId.value));
  }
  if (bloquearAlExportar.value) {
    params.set('bloquear', 'true');
  }
  return params.toString();
}

async function cargarBloqueos() {
  const sid = bloqueoServicioId.value || servicioId.value;
  const qs = sid ? `?servicioId=${sid}&soloActivos=true` : '?soloActivos=true';
  bloqueos.value = await api<PeriodoBloqueo[]>(`/periodos-bloqueo${qs}`);
}

async function descargar() {
  if (!personaStore.persona || !tipoEventoId.value) return;
  descargando.value = true;
  error.value = '';
  exito.value = '';

  try {
    const qs = buildQuery();
    const blob = await $fetch<Blob>(`/exports/rrhh?${qs}`, {
      baseURL: apiBase,
      headers: {
        'X-Shift-Legajo': String(personaStore.persona.legajo),
      },
      responseType: 'blob',
    });

    const tipo = tipos.value.find((t) => t.id === tipoEventoId.value);
    const slug = tipo?.codigo?.toLowerCase() ?? `t${tipoEventoId.value}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift-rrhh-${slug}-${modo.value}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    exito.value = bloquearAlExportar.value
      ? 'Archivo descargado y período bloqueado para empleados.'
      : 'Archivo descargado correctamente.';
    if (bloquearAlExportar.value) {
      await cargarBloqueos();
    }
  } catch (e: unknown) {
    error.value = apiErrorMessage(e, 'No se pudo generar la exportación');
  } finally {
    descargando.value = false;
  }
}

async function crearBloqueo() {
  if (!bloqueoServicioId.value || !bloqueoTipoId.value) return;
  bloqueando.value = true;
  errorBloqueo.value = '';
  try {
    await api('/periodos-bloqueo', {
      method: 'POST',
      body: {
        servicioId: bloqueoServicioId.value,
        tipoEventoId: bloqueoTipoId.value,
        fechaDesde: bloqueoDesde.value,
        fechaHasta: bloqueoHasta.value,
        motivo: 'Bloqueo manual',
      },
    });
    await cargarBloqueos();
  } catch (e: unknown) {
    errorBloqueo.value = apiErrorMessage(e, 'No se pudo crear el bloqueo');
  } finally {
    bloqueando.value = false;
  }
}

async function desactivarBloqueo(id: number) {
  desactivandoId.value = id;
  errorBloqueo.value = '';
  try {
    await api(`/periodos-bloqueo/${id}/desactivar`, { method: 'PATCH' });
    await cargarBloqueos();
  } catch (e: unknown) {
    errorBloqueo.value = apiErrorMessage(e, 'No se pudo desbloquear');
  } finally {
    desactivandoId.value = null;
  }
}

onMounted(async () => {
  try {
    const def = await api<{ fechaDesde: string; fechaHasta: string }>(
      '/periodos-bloqueo/default-rango',
    );
    bloqueoDesde.value = def.fechaDesde;
    bloqueoHasta.value = def.fechaHasta;

    servicios.value = await api<Servicio[]>('/servicios?activo=true');
    if (servicios.value.length) {
      servicioId.value = servicios.value[0]!.id;
      bloqueoServicioId.value = servicios.value[0]!.id;
    }
    tipos.value = await api<TipoEvento[]>('/tipos-evento?activo=true');
    if (tipos.value.length) {
      tipoEventoId.value = tipos.value[0]!.id;
      bloqueoTipoId.value = tipos.value[0]!.id;
    }
    await cargarBloqueos();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargandoTipos.value = false;
  }
});

watch(bloqueoServicioId, () => {
  void cargarBloqueos();
});
</script>
