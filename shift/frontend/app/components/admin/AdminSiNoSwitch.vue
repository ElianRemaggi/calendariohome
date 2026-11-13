<template>
  <label
    class="inline-flex cursor-pointer items-center gap-2"
    :class="disabled ? 'cursor-not-allowed opacity-50' : ''"
  >
    <span
      v-if="label"
      class="min-w-0 text-xs text-shift-muted"
      :class="compact ? 'sr-only' : ''"
    >
      {{ label }}
    </span>
    <span
      class="text-xs font-medium tabular-nums transition"
      :class="!modelValue ? 'text-shift-accent' : 'text-shift-muted'"
      aria-hidden="true"
    >
      No
    </span>
    <span class="relative inline-flex h-5 w-9 shrink-0">
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="modelValue"
        :disabled="disabled"
        :aria-label="ariaLabel"
        @change="onChange"
      />
      <span
        class="admin-switch-track absolute inset-0 rounded-full border border-shift-border bg-shift-bg transition peer-focus-visible:ring-2 peer-disabled:opacity-60"
        aria-hidden="true"
      />
      <span
        class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-shift-muted transition peer-checked:translate-x-4 peer-checked:bg-shift-accent"
        aria-hidden="true"
      />
    </span>
    <span
      class="text-xs font-medium tabular-nums transition"
      :class="modelValue ? 'text-shift-accent' : 'text-shift-muted'"
      aria-hidden="true"
    >
      Sí
    </span>
    <span class="sr-only">{{ modelValue ? 'Sí' : 'No' }}</span>
  </label>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
    disabled?: boolean;
    /** En tabla: solo switch + No/Sí; el label va en cabecera */
    compact?: boolean;
  }>(),
  { compact: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const ariaLabel = computed(() => {
  const estado = props.modelValue ? 'Sí' : 'No';
  return props.label ? `${props.label}: ${estado}` : estado;
});

function onChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  emit('update:modelValue', checked);
}
</script>
