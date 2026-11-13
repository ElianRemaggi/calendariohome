<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-md rounded-xl border border-shift-border bg-shift-card p-6 shadow-xl">
      <h2 class="text-lg font-semibold text-amber-300">Exceso de cupo</h2>
      <p class="mt-3 text-sm text-shift-muted">
        {{ mensaje }}
      </p>
      <ul v-if="advertencias.length > 1" class="mt-2 list-inside list-disc text-sm text-shift-muted">
        <li v-for="(a, i) in advertencias" :key="i">{{ a.mensaje }}</li>
      </ul>
      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-shift-muted hover:bg-shift-border"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
        <button
          v-if="permiteExcesoCupo"
          type="button"
          class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          @click="$emit('confirm')"
        >
          Anotarme igual
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReglaMensaje } from '~/types';

withDefaults(
  defineProps<{
    open: boolean;
    advertencias: ReglaMensaje[];
    permiteExcesoCupo?: boolean;
    mensaje?: string;
  }>(),
  {
    permiteExcesoCupo: true,
    mensaje:
      'El cupo máximo recomendado para este día fue alcanzado. Puede anotarse igualmente, pero el evento quedará marcado como exceso de cupo.',
  },
);

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
