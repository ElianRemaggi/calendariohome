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
      <h2 :id="titleId" class="text-lg font-semibold" :class="tituloClass">
        {{ titulo }}
      </h2>
      <p :id="descId" class="mt-3 text-sm text-shift-muted">
        {{ mensaje }}
      </p>
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-shift-muted hover:bg-shift-border"
          @click="$emit('cancel')"
        >
          {{ etiquetaCancelar }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="botonConfirmarClass"
          @click="$emit('confirm')"
        >
          {{ etiquetaConfirmar }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const uid = useId();

const props = withDefaults(
  defineProps<{
    open: boolean;
    titulo?: string;
    mensaje: string;
    etiquetaConfirmar?: string;
    etiquetaCancelar?: string;
    variante?: 'danger' | 'primary';
  }>(),
  {
    titulo: 'Confirmar',
    etiquetaConfirmar: 'Confirmar',
    etiquetaCancelar: 'Volver',
    variante: 'primary',
  },
);

defineEmits<{
  confirm: [];
  cancel: [];
}>();

const titleId = `${uid}-title`;
const descId = `${uid}-desc`;

const tituloClass = computed(() =>
  props.variante === 'danger' ? 'text-red-300' : 'text-shift-text',
);

const botonConfirmarClass = computed(() =>
  props.variante === 'danger'
    ? 'border border-red-800 bg-red-950 text-red-200 hover:bg-red-900'
    : 'bg-shift-accent text-white hover:opacity-90',
);
</script>
