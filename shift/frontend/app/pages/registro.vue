<template>
  <div class="mx-auto max-w-md pt-8">
    <div class="rounded-xl border border-shift-border bg-shift-card p-8">
      <h1 class="text-xl font-semibold">Registro</h1>
      <p class="mt-2 text-sm text-shift-muted">
        Legajo <span class="font-mono text-white">{{ legajo }}</span> — complete sus datos
      </p>

      <form v-if="!cargandoCatalogos" class="mt-6 space-y-4" @submit.prevent="registrar">
        <div>
          <label class="mb-1 block text-sm text-shift-muted">Apellido y nombre</label>
          <input
            v-model="nombre"
            type="text"
            required
            minlength="2"
            maxlength="30"
            class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-shift-muted">Función</label>
          <select
            v-model.number="funcionId"
            required
            class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
          >
            <option v-for="f in funciones" :key="f.id" :value="f.id">{{ f.nombre }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-shift-muted">Servicio</label>
          <select
            v-model.number="servicioId"
            required
            class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
          >
            <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          class="w-full rounded-lg bg-shift-accent py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="guardando"
        >
          {{ guardando ? 'Guardando…' : 'Registrarme' }}
        </button>
        <NuxtLink to="/" class="block text-center text-sm text-shift-muted hover:text-white">
          Volver
        </NuxtLink>
      </form>
      <p v-else class="mt-6 text-sm text-shift-muted">Cargando catálogos…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Funcion, Persona, Servicio } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';
import { validarNombrePersona } from '~/utils/persona-nombre';

definePageMeta({ layout: 'default' });

const personaStore = usePersonaStore();
const { push, replace } = useShiftRoute();
const { api } = useApi();

const nombre = ref('');
const funcionId = ref(0);
const servicioId = ref(0);
const funciones = ref<Funcion[]>([]);
const servicios = ref<Servicio[]>([]);
const cargandoCatalogos = ref(true);
const guardando = ref(false);
const error = ref('');

const legajo = computed(() => personaStore.pendingLegajo);

async function cargarFunciones() {
  if (!servicioId.value) {
    funciones.value = [];
    return;
  }
  funciones.value = await api<Funcion[]>(
    `/funciones?servicioId=${servicioId.value}&activo=true`,
  );
  if (!funciones.value.some((f) => f.id === funcionId.value)) {
    funcionId.value = funciones.value[0]?.id ?? 0;
  }
}

watch(servicioId, () => {
  void cargarFunciones();
});

onMounted(async () => {
  personaStore.hydrate();
  if (!legajo.value) {
    await replace('/');
    return;
  }
  try {
    const s = await api<Servicio[]>('/servicios?activo=true');
    servicios.value = s;
    servicioId.value = s[0]?.id ?? 0;
    await cargarFunciones();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e, 'Error al cargar catálogos');
  } finally {
    cargandoCatalogos.value = false;
  }
});

async function registrar() {
  if (!legajo.value) return;
  const msgNombre = validarNombrePersona(nombre.value);
  if (msgNombre) {
    error.value = msgNombre;
    return;
  }
  guardando.value = true;
  error.value = '';
  try {
    const persona = await api<Persona>('/personas', {
      method: 'POST',
      body: {
        legajo: legajo.value,
        nombre: nombre.value.trim(),
        funcionId: funcionId.value,
        servicioId: servicioId.value,
      },
    });
    personaStore.setPersona(persona);
    await push('/calendario');
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}
</script>
