<template>
  <div class="rounded-xl border border-shift-border bg-shift-card p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Tipos de evento</h2>
        <p class="mt-1 text-sm text-shift-muted">
          Alta y edición de reglas por tipo. No se puede desactivar si hay eventos asociados.
        </p>
      </div>
      <button
        v-if="!panelAbierto"
        type="button"
        class="btn-admin-primary shrink-0"
        @click="abrirNuevo"
      >
        Nuevo tipo de evento
      </button>
    </div>

    <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>

    <form
      v-if="panelAbierto"
      class="mt-6 space-y-6 rounded-lg border border-shift-accent/30 bg-shift-bg/40 p-4 sm:p-5"
      @submit.prevent="onSubmit"
    >
      <h3 class="text-sm font-semibold text-shift-accent">
        {{ esEdicion ? 'Editar tipo de evento' : 'Nuevo tipo de evento' }}
      </h3>

      <section>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-shift-muted">
          Datos básicos
        </h4>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Nombre</label>
            <input
              v-model="form.nombre"
              type="text"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Código</label>
            <input
              v-model="form.codigo"
              type="text"
              required
              :readonly="esEdicion"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm font-mono uppercase"
              :class="esEdicion ? 'cursor-not-allowed opacity-70' : ''"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Cupos por día</label>
            <input
              v-model.number="form.cupoDiario"
              type="number"
              min="0"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-shift-muted">
          Reglas
        </h4>
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
              class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
            >
              <span class="text-xs leading-snug text-shift-muted">Permitir exceso de cupo</span>
              <AdminSiNoSwitch v-model="form.permiteExcesoCupo" compact />
            </div>
            <div
              class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
            >
              <span class="text-xs leading-snug text-shift-muted">Carga por rango</span>
              <AdminSiNoSwitch v-model="form.permiteCargaPorRango" compact />
            </div>
            <div
              class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
            >
              <span class="text-xs leading-snug text-shift-muted">Bloqueo fines de semana</span>
              <AdminSiNoSwitch v-model="form.bloqueaFinDeSemana" compact />
            </div>
            <div
              class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
            >
              <span class="text-xs leading-snug text-shift-muted">Bloqueo feriados</span>
              <AdminSiNoSwitch v-model="form.bloqueaFeriado" compact />
            </div>
          </div>

          <div
            v-if="form.permiteCargaPorRango"
            class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div
              class="flex flex-col gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 sm:col-span-2 lg:col-span-4"
            >
              <span class="text-xs font-medium text-shift-text">Días por pedido (rango)</span>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs text-shift-muted">
                    Mín. días
                  </label>
                  <input
                    v-model.number="form.minDiasRango"
                    type="number"
                    min="1"
                    placeholder="Sin mínimo"
                    class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
                  />
                  <p class="mt-1 text-xs text-shift-muted">Vacío = sin mínimo</p>
                </div>
                <div>
                  <label class="mb-1 block text-xs text-shift-muted">
                    Máx. días
                  </label>
                  <input
                    v-model.number="form.maxDiasRango"
                    type="number"
                    min="1"
                    placeholder="Sin máximo"
                    class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
                  />
                  <p class="mt-1 text-xs text-shift-muted">Vacío = sin máximo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-shift-muted">
          Ventana temporal
        </h4>
        <p class="mb-3 text-xs text-shift-muted">
          Meses en que un usuario (no admin) puede crear o editar eventos de este tipo.
        </p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
          >
            <span class="text-xs leading-snug text-shift-muted">Carga meses anteriores</span>
            <AdminSiNoSwitch v-model="form.cargaMesesAnteriores" compact />
          </div>
          <div
            class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
          >
            <span class="text-xs leading-snug text-shift-muted">Carga meses siguientes</span>
            <AdminSiNoSwitch v-model="form.cargaMesesSiguientes" compact />
          </div>
          <div
            v-if="form.cargaMesesSiguientes"
            class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center"
          >
            <span class="text-xs leading-snug text-shift-muted">Meses siguientes ilimitados</span>
            <AdminSiNoSwitch v-model="form.mesesSiguientesInfinito" compact />
          </div>
          <div
            v-if="form.cargaMesesSiguientes && !form.mesesSiguientesInfinito"
            class="flex flex-col justify-center gap-2 rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3"
          >
            <label class="text-xs text-shift-muted">Cantidad de meses siguientes</label>
            <input
              v-model.number="form.mesesSiguientesCantidad"
              type="number"
              min="1"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <div
            v-else-if="form.cargaMesesSiguientes && form.mesesSiguientesInfinito"
            class="flex flex-col justify-center rounded-lg border border-shift-border/60 bg-shift-bg/30 px-3 py-3 text-center sm:col-span-2 lg:col-span-1"
          >
            <p class="text-xs text-shift-muted">Sin tope hacia meses futuros.</p>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap justify-end gap-2 border-t border-shift-border/60 pt-4">
        <template v-if="esEdicion">
          <button
            type="button"
            class="btn-admin-danger"
            :disabled="guardando"
            @click="eliminarTipo"
          >
            Eliminar
          </button>
          <button type="button" class="btn-admin-muted" :disabled="guardando" @click="cerrarPanel">
            Cancelar
          </button>
          <button type="submit" class="btn-admin-primary" :disabled="guardando">
            {{ guardando ? 'Guardando…' : 'Actualizar' }}
          </button>
        </template>
        <template v-else>
          <button type="button" class="btn-admin-muted" :disabled="guardando" @click="cerrarPanel">
            Cancelar
          </button>
          <button type="submit" class="btn-admin-primary" :disabled="guardando">
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </button>
        </template>
      </div>
    </form>

    <p v-if="cargando" class="mt-6 text-sm text-shift-muted">Cargando…</p>

    <div v-else class="mt-6 overflow-x-auto">
      <table class="w-full min-w-[44rem] text-left text-sm">
        <thead>
          <tr class="border-b border-shift-border text-shift-muted">
            <th class="pb-2 pr-3">Nombre</th>
            <th class="pb-2 pr-3">Código</th>
            <th class="pb-2 pr-3">Ev.</th>
            <th class="pb-2 pr-3">Cupo</th>
            <th class="pb-2 pr-3">Ventana</th>
            <th class="pb-2 pr-3">Exceso</th>
            <th class="pb-2 pr-3">Rango</th>
            <th class="pb-2 pr-3">Días pedido</th>
            <th class="pb-2 pr-3">F.sem.</th>
            <th class="pb-2 pr-3">Feriado</th>
            <th class="pb-2 pr-3">Estado</th>
            <th class="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!tipos.length">
            <td colspan="12" class="py-6 text-center text-shift-muted">
              No hay tipos de evento cargados.
            </td>
          </tr>
          <tr
            v-for="t in tipos"
            :key="t.id"
            class="border-b border-shift-border/50"
            :class="editId === t.id ? 'bg-shift-accent/5' : ''"
          >
            <td class="py-3 pr-3">{{ t.nombre }}</td>
            <td class="py-3 pr-3 font-mono text-xs text-shift-muted">{{ t.codigo }}</td>
            <td class="py-3 pr-3 text-shift-muted">{{ countEventos(t) }}</td>
            <td class="py-3 pr-3">{{ t.cupoDiario }}</td>
            <td class="py-3 pr-3 text-xs text-shift-muted">{{ etiquetaVentana(t) }}</td>
            <td class="py-3 pr-3">{{ t.permiteExcesoCupo ? 'Sí' : 'No' }}</td>
            <td class="py-3 pr-3">{{ t.permiteCargaPorRango ? 'Sí' : 'No' }}</td>
            <td class="py-3 pr-3 text-xs text-shift-muted">{{ etiquetaDiasRango(t) }}</td>
            <td class="py-3 pr-3">{{ t.bloqueaFinDeSemana ? 'Sí' : 'No' }}</td>
            <td class="py-3 pr-3">{{ t.bloqueaFeriado ? 'Sí' : 'No' }}</td>
            <td class="py-3 pr-3">
              <span
                class="rounded px-2 py-0.5 text-xs"
                :class="
                  t.activo
                    ? 'bg-emerald-950/50 text-emerald-300'
                    : 'bg-shift-border text-shift-muted'
                "
              >
                {{ t.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="py-3">
              <button type="button" class="btn-admin-primary" @click="abrirEditar(t)">
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TipoEvento } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';

type TipoRow = TipoEvento & { _count?: { eventos: number } };

interface TipoFormState {
  nombre: string;
  codigo: string;
  cupoDiario: number;
  permiteExcesoCupo: boolean;
  permiteCargaPorRango: boolean;
  bloqueaFinDeSemana: boolean;
  bloqueaFeriado: boolean;
  cargaMesesAnteriores: boolean;
  cargaMesesSiguientes: boolean;
  mesesSiguientesInfinito: boolean;
  mesesSiguientesCantidad: number;
  minDiasRango: number | null;
  maxDiasRango: number | null;
}

const { api } = useApi();

const tipos = ref<TipoRow[]>([]);
const cargando = ref(true);
const guardando = ref(false);
const error = ref('');
const panelAbierto = ref(false);
const editId = ref<number | null>(null);

const form = reactive<TipoFormState>(formularioVacio());

const esEdicion = computed(() => editId.value !== null);

function formularioVacio(): TipoFormState {
  return {
    nombre: '',
    codigo: '',
    cupoDiario: 3,
    permiteExcesoCupo: false,
    permiteCargaPorRango: false,
    bloqueaFinDeSemana: true,
    bloqueaFeriado: true,
    cargaMesesAnteriores: false,
    cargaMesesSiguientes: true,
    mesesSiguientesInfinito: true,
    mesesSiguientesCantidad: 1,
    minDiasRango: null,
    maxDiasRango: null,
  };
}

function etiquetaDiasRango(t: TipoRow): string {
  if (!t.permiteCargaPorRango) return '—';
  const min = t.minDiasRango;
  const max = t.maxDiasRango;
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `mín ${min}`;
  if (max != null) return `máx ${max}`;
  return 'sin tope';
}

function diasRangoDesdeForm(f: TipoFormState) {
  if (!f.permiteCargaPorRango) {
    return { minDiasRango: null, maxDiasRango: null };
  }
  const min =
    f.minDiasRango != null && !Number.isNaN(f.minDiasRango) && f.minDiasRango >= 1
      ? f.minDiasRango
      : null;
  const max =
    f.maxDiasRango != null && !Number.isNaN(f.maxDiasRango) && f.maxDiasRango >= 1
      ? f.maxDiasRango
      : null;
  if (min !== null && max !== null && min > max) {
    throw new Error('El mínimo de días no puede ser mayor que el máximo');
  }
  return { minDiasRango: min, maxDiasRango: max };
}

function countEventos(t: TipoRow): number {
  return t._count?.eventos ?? 0;
}

function etiquetaVentana(t: TipoRow): string {
  const min = t.mesMinOffsetUser ?? 0;
  const atras = min < 0 ? `${Math.abs(min)} atrás` : 'sin atrás';
  const max = t.mesMaxOffsetUser;
  const adelante =
    max === null || max === undefined ? '∞ adelante' : max === 0 ? 'sin adelante' : `+${max}`;
  return `${atras}, ${adelante}`;
}

function ventanaDesdeForm(f: TipoFormState) {
  /** Sí = hasta 12 meses atrás (configurable por admin vía switch). */
  const mesMinOffsetUser = f.cargaMesesAnteriores ? -12 : 0;
  let mesMaxOffsetUser: number | null;
  if (!f.cargaMesesSiguientes) {
    mesMaxOffsetUser = 0;
  } else if (f.mesesSiguientesInfinito) {
    mesMaxOffsetUser = null;
  } else {
    mesMaxOffsetUser = Math.max(1, f.mesesSiguientesCantidad);
  }
  return { mesMinOffsetUser, mesMaxOffsetUser };
}

function cargarFormDesdeTipo(t: TipoRow) {
  const min = t.mesMinOffsetUser ?? 0;
  const max = t.mesMaxOffsetUser;

  Object.assign(form, {
    nombre: t.nombre,
    codigo: t.codigo,
    cupoDiario: t.cupoDiario,
    permiteExcesoCupo: t.permiteExcesoCupo,
    permiteCargaPorRango: t.permiteCargaPorRango,
    bloqueaFinDeSemana: t.bloqueaFinDeSemana ?? true,
    bloqueaFeriado: t.bloqueaFeriado ?? true,
    cargaMesesAnteriores: min < 0,
    cargaMesesSiguientes: max === null || max === undefined || max > 0,
    mesesSiguientesInfinito: max === null || max === undefined,
    mesesSiguientesCantidad:
      max !== null && max !== undefined && max > 0 ? max : 1,
    minDiasRango: t.minDiasRango ?? null,
    maxDiasRango: t.maxDiasRango ?? null,
  });
}

function resetForm() {
  Object.assign(form, formularioVacio());
}

function cerrarPanel() {
  panelAbierto.value = false;
  editId.value = null;
  resetForm();
  error.value = '';
}

function abrirNuevo() {
  editId.value = null;
  resetForm();
  error.value = '';
  panelAbierto.value = true;
}

function abrirEditar(t: TipoRow) {
  editId.value = t.id;
  cargarFormDesdeTipo(t);
  error.value = '';
  panelAbierto.value = true;
}

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    tipos.value = await api<TipoRow[]>('/tipos-evento');
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargando.value = false;
  }
}

function bodyDesdeForm() {
  return {
    nombre: form.nombre.trim(),
    codigo: form.codigo.trim().toUpperCase(),
    cupoDiario: form.cupoDiario,
    permiteExcesoCupo: form.permiteExcesoCupo,
    permiteCargaPorRango: form.permiteCargaPorRango,
    bloqueaFinDeSemana: form.bloqueaFinDeSemana,
    bloqueaFeriado: form.bloqueaFeriado,
    ...ventanaDesdeForm(form),
    ...diasRangoDesdeForm(form),
  };
}

async function onSubmit() {
  guardando.value = true;
  error.value = '';
  try {
    const body = bodyDesdeForm();
    if (esEdicion.value && editId.value !== null) {
      const {
        nombre,
        cupoDiario,
        permiteExcesoCupo,
        permiteCargaPorRango,
        bloqueaFinDeSemana,
        bloqueaFeriado,
        mesMinOffsetUser,
        mesMaxOffsetUser,
        minDiasRango,
        maxDiasRango,
      } = body;
      await api(`/tipos-evento/${editId.value}`, {
        method: 'PATCH',
        body: {
          nombre,
          cupoDiario,
          permiteExcesoCupo,
          permiteCargaPorRango,
          bloqueaFinDeSemana,
          bloqueaFeriado,
          mesMinOffsetUser,
          mesMaxOffsetUser,
          minDiasRango,
          maxDiasRango,
        },
      });
    } else {
      await api('/tipos-evento', {
        method: 'POST',
        body,
      });
    }
    cerrarPanel();
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function eliminarTipo() {
  if (editId.value === null) return;
  const t = tipos.value.find((x) => x.id === editId.value);
  if (!t) return;

  if (countEventos(t) > 0) {
    error.value = `No se puede eliminar: ${countEventos(t)} evento(s) usan este tipo.`;
    return;
  }

  if (!import.meta.client) return;
  const ok = window.confirm(
    `¿Desactivar el tipo «${t.nombre}»? Dejará de estar disponible para nuevas cargas.`,
  );
  if (!ok) return;

  guardando.value = true;
  error.value = '';
  try {
    await api(`/tipos-evento/${t.id}`, {
      method: 'PATCH',
      body: { activo: false },
    });
    cerrarPanel();
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

onMounted(cargar);
</script>
