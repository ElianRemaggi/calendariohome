<template>
  <div class="rounded-xl border border-shift-border bg-shift-card p-6">
    <h2 class="text-lg font-semibold">{{ title }}</h2>

    <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="crear">
      <div class="min-w-[200px] flex-1">
        <label class="mb-1 block text-xs text-shift-muted">Nombre</label>
        <input
          v-model="nuevoNombre"
          type="text"
          required
          class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        class="rounded-lg bg-shift-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        :disabled="guardando"
      >
        Agregar
      </button>
    </form>

    <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
    <p v-if="cargando" class="mt-4 text-sm text-shift-muted">Cargando…</p>

    <table v-else class="mt-6 w-full text-left text-sm">
      <thead>
        <tr class="border-b border-shift-border text-shift-muted">
          <th class="pb-2 pr-4">Nombre</th>
          <th class="pb-2 pr-4">Estado</th>
          <th class="pb-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-shift-border/50"
        >
          <td class="py-3 pr-4">
            <input
              v-if="editId === item.id"
              v-model="editNombre"
              type="text"
              class="w-full rounded border border-shift-border bg-shift-bg px-2 py-1"
            />
            <span v-else>{{ item.nombre }}</span>
          </td>
          <td class="py-3 pr-4">
            <span
              class="rounded px-2 py-0.5 text-xs"
              :class="item.activo ? 'bg-emerald-900/40 text-emerald-200' : 'bg-shift-border text-shift-muted'"
            >
              {{ item.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="py-3">
            <template v-if="editId === item.id">
              <button
                type="button"
                class="mr-2 text-shift-accent hover:underline"
                @click="guardarEdicion(item.id)"
              >
                Guardar
              </button>
              <button
                type="button"
                class="text-shift-muted hover:underline"
                @click="cancelarEdicion"
              >
                Cancelar
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="mr-2 text-shift-accent hover:underline"
                @click="iniciarEdicion(item)"
              >
                Editar
              </button>
              <button
                type="button"
                class="text-shift-muted hover:underline"
                @click="toggleActivo(item)"
              >
                {{ item.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { apiErrorMessage } from '~/utils/api-error';

interface CatalogItem {
  id: number;
  nombre: string;
  activo: boolean;
}

const props = defineProps<{
  title: string;
  endpoint: string;
}>();

const { api } = useApi();

const items = ref<CatalogItem[]>([]);
const cargando = ref(true);
const guardando = ref(false);
const error = ref('');
const nuevoNombre = ref('');
const editId = ref<number | null>(null);
const editNombre = ref('');

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    items.value = await api<CatalogItem[]>(props.endpoint);
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargando.value = false;
  }
}

async function crear() {
  guardando.value = true;
  error.value = '';
  try {
    await api(props.endpoint, {
      method: 'POST',
      body: { nombre: nuevoNombre.value.trim() },
    });
    nuevoNombre.value = '';
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

function iniciarEdicion(item: CatalogItem) {
  editId.value = item.id;
  editNombre.value = item.nombre;
}

function cancelarEdicion() {
  editId.value = null;
  editNombre.value = '';
}

async function guardarEdicion(id: number) {
  guardando.value = true;
  error.value = '';
  try {
    await api(`${props.endpoint}/${id}`, {
      method: 'PATCH',
      body: { nombre: editNombre.value.trim() },
    });
    cancelarEdicion();
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function toggleActivo(item: CatalogItem) {
  guardando.value = true;
  error.value = '';
  try {
    await api(`${props.endpoint}/${item.id}`, {
      method: 'PATCH',
      body: { activo: !item.activo },
    });
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

onMounted(cargar);
</script>
