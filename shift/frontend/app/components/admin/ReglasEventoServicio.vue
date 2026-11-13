<template>
  <div class="rounded-xl border border-shift-border bg-shift-card p-6">
    <div>
      <h2 class="text-lg font-semibold">Reglas por tipo de evento</h2>
      <p class="mt-1 text-sm text-shift-muted">
        Personalizá las reglas solo para este servicio. Si no activás reglas propias, se aplican las
        definidas por el super administrador.
      </p>
    </div>

    <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
    <p v-if="cargando" class="mt-6 text-sm text-shift-muted">Cargando reglas…</p>

    <ul v-else class="mt-6 divide-y divide-shift-border/60 rounded-xl border border-shift-border/80">
      <li
        v-for="item in items"
        :key="item.tipoEvento.id"
        class="bg-shift-bg/20 first:rounded-t-xl last:rounded-b-xl"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
          :class="expandidoId === item.tipoEvento.id ? 'border-b border-shift-border/50' : ''"
        >
          <h3 class="min-w-0 font-medium leading-snug">{{ item.tipoEvento.nombre }}</h3>
          <button
            type="button"
            class="btn-admin-muted shrink-0 text-sm"
            :aria-expanded="expandidoId === item.tipoEvento.id"
            @click="toggleDetalle(item.tipoEvento.id)"
          >
            {{ expandidoId === item.tipoEvento.id ? 'Ocultar detalle' : 'Ver detalle' }}
          </button>
        </div>

        <div
          v-show="expandidoId === item.tipoEvento.id"
          class="space-y-4 px-4 pb-4 pt-3"
        >
        <div
          class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
        >
          <span class="text-xs leading-snug text-shift-muted">Reglas propias del servicio</span>
          <AdminSiNoSwitch
            v-model="edit[item.tipoEvento.id]!.usaOverride"
            compact
          />
        </div>

        <div v-if="!edit[item.tipoEvento.id]?.usaOverride" class="mt-4 flex-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-shift-muted">
            Hereda del estándar
          </p>
          <dl class="mt-2 grid gap-2 text-xs">
            <div class="flex justify-between gap-2">
              <dt class="text-shift-muted">Cupo / día</dt>
              <dd>{{ item.efectiva.cupoDiario }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-shift-muted">Exceso cupo</dt>
              <dd>{{ item.efectiva.permiteExcesoCupo ? 'Sí' : 'No' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-shift-muted">Rango</dt>
              <dd>{{ item.efectiva.permiteCargaPorRango ? 'Sí' : 'No' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-shift-muted">Fines de semana</dt>
              <dd>{{ item.efectiva.bloqueaFinDeSemana ? 'Bloquea' : 'Permite' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-shift-muted">Feriados</dt>
              <dd>{{ item.efectiva.bloqueaFeriado ? 'Bloquea' : 'Permite' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-shift-muted">Ventana</dt>
              <dd class="text-right">{{ etiquetaVentana(item.efectiva) }}</dd>
            </div>
            <div
              v-if="item.efectiva.permiteCargaPorRango"
              class="flex justify-between gap-2"
            >
              <dt class="text-shift-muted">Días pedido</dt>
              <dd>{{ etiquetaDiasRango(item.efectiva) }}</dd>
            </div>
          </dl>
        </div>

        <div v-else class="mt-4 flex-1 space-y-4">
          <section>
            <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-shift-muted">
              Cupo
            </h4>
            <div
              class="flex flex-col justify-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3"
            >
              <label class="text-xs text-shift-muted">Cupos por día</label>
              <input
                v-model.number="edit[item.tipoEvento.id]!.cupoDiario"
                type="number"
                min="0"
                class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section>
            <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-shift-muted">
              Reglas
            </h4>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Permitir exceso de cupo</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.permiteExcesoCupo"
                  compact
                />
              </div>
              <div
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Carga por rango</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.permiteCargaPorRango"
                  compact
                />
              </div>
              <div
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Bloqueo fines de semana</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.bloqueaFinDeSemana"
                  compact
                />
              </div>
              <div
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Bloqueo feriados</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.bloqueaFeriado"
                  compact
                />
              </div>
            </div>

            <div
              v-if="edit[item.tipoEvento.id]!.permiteCargaPorRango"
              class="mt-3 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3"
            >
              <span class="text-xs font-medium text-shift-text">Días por pedido (rango)</span>
              <div class="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs text-shift-muted">Mín. días</label>
                  <input
                    v-model.number="edit[item.tipoEvento.id]!.minDiasRango"
                    type="number"
                    min="1"
                    placeholder="Sin mínimo"
                    class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-shift-muted">Máx. días</label>
                  <input
                    v-model.number="edit[item.tipoEvento.id]!.maxDiasRango"
                    type="number"
                    min="1"
                    placeholder="Sin máximo"
                    class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-shift-muted">
              Ventana temporal
            </h4>
            <p class="mb-2 text-xs text-shift-muted">
              Meses en que un usuario puede crear o editar este tipo.
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Carga meses anteriores</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.cargaMesesAnteriores"
                  compact
                />
              </div>
              <div
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Carga meses siguientes</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.cargaMesesSiguientes"
                  compact
                />
              </div>
              <div
                v-if="edit[item.tipoEvento.id]!.cargaMesesSiguientes"
                class="flex flex-col items-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3 text-center"
              >
                <span class="text-xs leading-snug text-shift-muted">Meses siguientes ilimitados</span>
                <AdminSiNoSwitch
                  v-model="edit[item.tipoEvento.id]!.mesesSiguientesInfinito"
                  compact
                />
              </div>
              <div
                v-if="
                  edit[item.tipoEvento.id]!.cargaMesesSiguientes &&
                  !edit[item.tipoEvento.id]!.mesesSiguientesInfinito
                "
                class="flex flex-col justify-center gap-2 rounded-lg border border-shift-border/60 bg-shift-card/50 px-3 py-3"
              >
                <label class="text-xs text-shift-muted">Cantidad de meses siguientes</label>
                <input
                  v-model.number="edit[item.tipoEvento.id]!.mesesSiguientesCantidad"
                  type="number"
                  min="1"
                  class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>
        </div>

        <div class="flex justify-end border-t border-shift-border/50 pt-4">
          <button
            type="button"
            class="btn-admin-primary"
            :disabled="guardandoId === item.tipoEvento.id"
            @click="guardar(item.tipoEvento.id)"
          >
            {{ guardandoId === item.tipoEvento.id ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
        </div>
      </li>
    </ul>

    <p
      v-if="!cargando && !items.length"
      class="mt-6 text-sm text-shift-muted"
    >
      No hay tipos de evento activos.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ServicioTipoEventoConfigItem, TipoEvento } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';

const props = defineProps<{ servicioId: number }>();

const { api } = useApi();
const items = ref<ServicioTipoEventoConfigItem[]>([]);
const cargando = ref(true);
const error = ref('');
const guardandoId = ref<number | null>(null);
const expandidoId = ref<number | null>(null);

function toggleDetalle(tipoId: number) {
  expandidoId.value = expandidoId.value === tipoId ? null : tipoId;
}

type EditRow = {
  usaOverride: boolean;
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
};

const edit = reactive<Record<number, EditRow>>({});

function etiquetaDiasRango(t: Pick<TipoEvento, 'permiteCargaPorRango' | 'minDiasRango' | 'maxDiasRango'>): string {
  if (!t.permiteCargaPorRango) return '—';
  const min = t.minDiasRango;
  const max = t.maxDiasRango;
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `mín ${min}`;
  if (max != null) return `máx ${max}`;
  return 'sin tope';
}

function etiquetaVentana(t: Pick<TipoEvento, 'mesMinOffsetUser' | 'mesMaxOffsetUser'>): string {
  const min = t.mesMinOffsetUser ?? 0;
  const atras = min < 0 ? `${Math.abs(min)} atrás` : 'sin atrás';
  const max = t.mesMaxOffsetUser;
  const adelante =
    max === null || max === undefined ? '∞ adelante' : max === 0 ? 'sin adelante' : `+${max}`;
  return `${atras}, ${adelante}`;
}

function ventanaDesdeRow(row: EditRow) {
  const mesMinOffsetUser = row.cargaMesesAnteriores ? -12 : 0;
  let mesMaxOffsetUser: number | null;
  if (!row.cargaMesesSiguientes) {
    mesMaxOffsetUser = 0;
  } else if (row.mesesSiguientesInfinito) {
    mesMaxOffsetUser = null;
  } else {
    mesMaxOffsetUser = Math.max(1, row.mesesSiguientesCantidad);
  }
  return { mesMinOffsetUser, mesMaxOffsetUser };
}

function ventanaEnRow(t: Pick<TipoEvento, 'mesMinOffsetUser' | 'mesMaxOffsetUser'>) {
  const min = t.mesMinOffsetUser ?? 0;
  const max = t.mesMaxOffsetUser;
  return {
    cargaMesesAnteriores: min < 0,
    cargaMesesSiguientes: max === null || max === undefined || max > 0,
    mesesSiguientesInfinito: max === null || max === undefined,
    mesesSiguientesCantidad: max !== null && max !== undefined && max > 0 ? max : 1,
  };
}

function diasRangoDesdeRow(row: EditRow) {
  if (!row.permiteCargaPorRango) {
    return { minDiasRango: null, maxDiasRango: null };
  }
  const min =
    row.minDiasRango != null && !Number.isNaN(row.minDiasRango) && row.minDiasRango >= 1
      ? row.minDiasRango
      : null;
  const max =
    row.maxDiasRango != null && !Number.isNaN(row.maxDiasRango) && row.maxDiasRango >= 1
      ? row.maxDiasRango
      : null;
  if (min !== null && max !== null && min > max) {
    throw new Error('El mínimo de días no puede ser mayor que el máximo');
  }
  return { minDiasRango: min, maxDiasRango: max };
}

function rowDesdeConfig(
  o: ServicioTipoEventoConfigItem['override'],
  e: TipoEvento,
): EditRow {
  const base = o?.usaOverride ? mergeOverride(e, o) : e;
  const ventana = ventanaEnRow(base);
  return {
    usaOverride: o?.usaOverride ?? false,
    cupoDiario: base.cupoDiario,
    permiteExcesoCupo: base.permiteExcesoCupo,
    permiteCargaPorRango: base.permiteCargaPorRango,
    bloqueaFinDeSemana: base.bloqueaFinDeSemana ?? true,
    bloqueaFeriado: base.bloqueaFeriado ?? true,
    ...ventana,
    minDiasRango: base.minDiasRango ?? null,
    maxDiasRango: base.maxDiasRango ?? null,
  };
}

function mergeOverride(
  e: TipoEvento,
  o: NonNullable<ServicioTipoEventoConfigItem['override']>,
): TipoEvento {
  return {
    ...e,
    cupoDiario: o.cupoDiario ?? e.cupoDiario,
    permiteExcesoCupo: o.permiteExcesoCupo ?? e.permiteExcesoCupo,
    permiteCargaPorRango: o.permiteCargaPorRango ?? e.permiteCargaPorRango,
    bloqueaFinDeSemana: o.bloqueaFinDeSemana ?? e.bloqueaFinDeSemana,
    bloqueaFeriado: o.bloqueaFeriado ?? e.bloqueaFeriado,
    mesMinOffsetUser: o.mesMinOffsetUser ?? e.mesMinOffsetUser,
    mesMaxOffsetUser: o.mesMaxOffsetUser ?? e.mesMaxOffsetUser,
    minDiasRango: o.minDiasRango ?? e.minDiasRango,
    maxDiasRango: o.maxDiasRango ?? e.maxDiasRango,
  };
}

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    items.value = await api<ServicioTipoEventoConfigItem[]>(
      `/servicios/${props.servicioId}/tipos-evento`,
    );
    for (const item of items.value) {
      edit[item.tipoEvento.id] = rowDesdeConfig(item.override, item.efectiva);
    }
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargando.value = false;
  }
}

async function guardar(tipoId: number) {
  const row = edit[tipoId];
  if (!row) return;
  guardandoId.value = tipoId;
  error.value = '';
  try {
    const body = row.usaOverride
      ? {
          usaOverride: true,
          cupoDiario: row.cupoDiario,
          permiteExcesoCupo: row.permiteExcesoCupo,
          permiteCargaPorRango: row.permiteCargaPorRango,
          bloqueaFinDeSemana: row.bloqueaFinDeSemana,
          bloqueaFeriado: row.bloqueaFeriado,
          ...ventanaDesdeRow(row),
          ...diasRangoDesdeRow(row),
        }
      : { usaOverride: false };

    await api(`/servicios/${props.servicioId}/tipos-evento/${tipoId}`, {
      method: 'PATCH',
      body,
    });
    await cargar();
    expandidoId.value = tipoId;
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardandoId.value = null;
  }
}

watch(
  () => props.servicioId,
  () => void cargar(),
  { immediate: true },
);
</script>
