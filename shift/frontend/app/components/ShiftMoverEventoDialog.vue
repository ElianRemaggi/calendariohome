<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="descId"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-md rounded-xl border border-shift-border bg-shift-card p-6 shadow-xl">
      <h2 :id="titleId" class="text-lg font-semibold">
        {{ titulo }}
      </h2>
      <p :id="descId" class="mt-3 text-sm leading-relaxed text-shift-muted">
        {{ mensajePrincipal }}
      </p>
      <p
        v-if="avisoExcesoCupo"
        class="mt-3 rounded-lg border border-amber-800/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200"
      >
        {{ avisoExcesoCupo }}
      </p>
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-shift-muted hover:bg-shift-border"
          :disabled="guardando"
          @click="$emit('cancel')"
        >
          No, volver
        </button>
        <button
          type="button"
          class="rounded-lg bg-shift-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="guardando"
          @click="$emit('confirm')"
        >
          {{ guardando ? 'Procesando…' : 'Sí, mover' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const uid = useId();

defineProps<{
  open: boolean;
  titulo: string;
  mensajePrincipal: string;
  avisoExcesoCupo?: string;
  guardando?: boolean;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();

const titleId = `${uid}-title`;
const descId = `${uid}-desc`;
</script>
