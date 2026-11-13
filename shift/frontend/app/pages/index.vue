<template>
  <div class="mx-auto max-w-sm pt-12">
    <div class="rounded-xl border border-shift-border bg-shift-card p-8 shadow-lg">
      <h1 class="text-2xl font-semibold tracking-tight">Shift</h1>
      <p class="mt-2 text-sm text-shift-muted">
        Gestión de Home Office y eventos laborales
      </p>

      <form class="mt-8 space-y-4" @submit.prevent="ingresar">
        <div>
          <label for="legajo" class="mb-1 block text-sm text-shift-muted">Legajo</label>
          <input
            id="legajo"
            v-model="legajoInput"
            type="number"
            min="1"
            required
            placeholder="Ej. 9147"
            class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2.5 text-lg tracking-wide"
            autofocus
          />
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          class="w-full rounded-lg bg-shift-accent py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="cargando"
        >
          {{ cargando ? 'Verificando…' : 'Ingresar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Persona } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';

definePageMeta({ layout: 'default' });

const personaStore = usePersonaStore();
const { push, replace } = useShiftRoute();
const { api } = useApi();

const legajoInput = ref('');
const cargando = ref(false);
const error = ref('');

onMounted(() => {
  personaStore.hydrate();
  if (personaStore.persona) {
    replace('/calendario');
  }
});

async function ingresar() {
  const legajo = Number(legajoInput.value);
  if (!Number.isInteger(legajo) || legajo <= 0) {
    error.value = 'Ingrese un legajo válido';
    return;
  }
  error.value = '';
  cargando.value = true;
  try {
    const persona = await api<Persona>(`/personas/by-legajo/${legajo}`);
    personaStore.setPersona(persona);
    await push('/calendario');
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404) {
      personaStore.setPendingLegajo(legajo);
      await push('/registro');
      return;
    }
    error.value = apiErrorMessage(e, 'No se pudo verificar el legajo');
  } finally {
    cargando.value = false;
  }
}
</script>
