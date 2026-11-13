<template>
  <AdminShell>
    <div class="rounded-xl border border-shift-border bg-shift-card p-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="text-lg font-semibold">Eventos del mes</h2>
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Mes</label>
            <input
              v-model="mes"
              type="month"
              class="rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              @change="cargar"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Tipo</label>
            <select
              v-model="tipoFiltro"
              class="rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              @change="cargar"
            >
              <option value="">Todos</option>
              <option v-for="t in tipos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
      <p v-if="cargando" class="mt-4 text-sm text-shift-muted">Cargando…</p>

      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b border-shift-border text-shift-muted">
              <th class="pb-2 pr-3">Fecha</th>
              <th class="pb-2 pr-3">Legajo</th>
              <th class="pb-2 pr-3">Nombre</th>
              <th class="pb-2 pr-3">Tipo</th>
              <th class="pb-2 pr-3">Estado</th>
              <th class="pb-2">Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ev in eventos"
              :key="ev.id"
              class="border-b border-shift-border/50"
              :class="ev.estado === 'CANCELADO' ? 'opacity-50' : ''"
            >
              <td class="py-2 pr-3 font-mono text-xs whitespace-nowrap">
                {{ formatRango(ev) }}
              </td>
              <td class="py-2 pr-3">{{ ev.persona?.legajo ?? '—' }}</td>
              <td class="py-2 pr-3">{{ ev.persona?.nombre ?? '—' }}</td>
              <td class="py-2 pr-3">{{ ev.tipoEvento.nombre }}</td>
              <td class="py-2 pr-3">
                <span
                  class="rounded px-2 py-0.5 text-xs"
                  :class="
                    ev.estado === 'ACTIVO'
                      ? 'bg-emerald-900/40 text-emerald-200'
                      : 'bg-shift-border text-shift-muted'
                  "
                >
                  {{ ev.estado }}
                </span>
              </td>
              <td class="py-2 text-xs text-shift-muted">
                <span v-if="ev.excesoCupo" class="text-amber-300">Exceso cupo</span>
                <span v-if="ev.observacion" class="ml-1">{{ ev.observacion }}</span>
              </td>
            </tr>
            <tr v-if="!eventos.length">
              <td colspan="6" class="py-8 text-center text-shift-muted">
                Sin eventos en {{ mes }}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="mt-3 text-xs text-shift-muted">{{ eventos.length }} registro(s)</p>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { Evento, TipoEvento } from '~/types';
import { currentMonthKey } from '~/utils/fechas';
import { apiErrorMessage } from '~/utils/api-error';

definePageMeta({ layout: 'default' });
useAdminPage();

const { api } = useApi();

const mes = ref(currentMonthKey());
const tipoFiltro = ref<number | ''>('');
const eventos = ref<Evento[]>([]);
const tipos = ref<TipoEvento[]>([]);
const cargando = ref(true);
const error = ref('');

function formatRango(ev: Evento): string {
  const d = ev.fechaDesde.slice(0, 10);
  const h = ev.fechaHasta.slice(0, 10);
  return d === h ? d : `${d} → ${h}`;
}

async function cargar() {
  cargando.value = true;
  error.value = '';
  const month = mes.value.length === 7 ? mes.value : mes.value.slice(0, 7);
  try {
    const qs = new URLSearchParams({ month, incluirCancelados: 'true' });
    if (tipoFiltro.value) {
      qs.set('tipoEventoId', String(tipoFiltro.value));
    }
    const [ev, te] = await Promise.all([
      api<Evento[]>(`/eventos?${qs}`),
      tipos.value.length
        ? Promise.resolve(tipos.value)
        : api<TipoEvento[]>('/tipos-evento'),
    ]);
    eventos.value = ev;
    tipos.value = te;
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargando.value = false;
  }
}

onMounted(cargar);
</script>
