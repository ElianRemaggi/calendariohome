<template>
  <div class="rounded-xl border border-shift-border bg-shift-card p-6">
    <h2 class="text-lg font-semibold">Funciones del servicio</h2>
    <p class="mt-1 text-sm text-shift-muted">
      Solo aplican a este servicio. Las funciones globales se asignan desde el alta de empleado.
    </p>
    <form class="mt-4 flex gap-2" @submit.prevent="crear">
      <input
        v-model="nuevoNombre"
        type="text"
        required
        placeholder="Nombre de función"
        class="min-w-0 flex-1 rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
      />
      <button type="submit" class="btn-admin-primary" :disabled="guardando">Agregar</button>
    </form>
    <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
    <ul class="mt-4 space-y-2">
      <li
        v-for="f in funcionesLocales"
        :key="f.id"
        class="flex items-center justify-between rounded-lg border border-shift-border/60 px-3 py-2 text-sm"
      >
        <span>{{ f.nombre }}</span>
        <span class="text-xs text-shift-muted">{{ f.activo ? 'Activa' : 'Inactiva' }}</span>
      </li>
      <li v-if="!funcionesLocales.length" class="text-sm text-shift-muted">
        Sin funciones propias; podés usar las globales al dar de alta empleados.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Funcion } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';

const props = defineProps<{ servicioId: number }>();

const { api } = useApi();
const funciones = ref<Funcion[]>([]);
const nuevoNombre = ref('');
const guardando = ref(false);
const error = ref('');

const funcionesLocales = computed(() =>
  funciones.value.filter((f) => f.servicioId === props.servicioId),
);

async function cargar() {
  funciones.value = await api<Funcion[]>(
    `/funciones?servicioId=${props.servicioId}&activo=true`,
  );
}

async function crear() {
  guardando.value = true;
  error.value = '';
  try {
    await api('/funciones', {
      method: 'POST',
      body: { nombre: nuevoNombre.value.trim(), servicioId: props.servicioId },
    });
    nuevoNombre.value = '';
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

watch(
  () => props.servicioId,
  () => void cargar(),
  { immediate: true },
);
</script>
