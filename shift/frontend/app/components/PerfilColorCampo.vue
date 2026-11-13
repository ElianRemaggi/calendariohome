<template>
  <div>
    <label class="mb-1 block text-xs text-shift-muted">{{ label }}</label>
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="color"
        :value="hexParaInput"
        class="h-10 w-14 cursor-pointer rounded-lg border border-shift-border bg-shift-bg"
        @input="onPicker"
      />
      <input
        :value="modelValue"
        type="text"
        maxlength="7"
        spellcheck="false"
        class="min-w-[7rem] flex-1 rounded-lg border border-shift-border bg-shift-bg px-3 py-2 font-mono text-sm uppercase"
        placeholder="#RRGGBB"
        @input="onTexto"
      />
    </div>
    <p v-if="hint" class="mt-1 text-xs text-shift-muted">{{ hint }}</p>
    <p v-if="invalido" class="mt-1 text-xs text-red-400">Formato inválido. Usá #RRGGBB.</p>
  </div>
</template>

<script setup lang="ts">
import { normalizarHexColor } from '~/utils/persona-colors';

const props = defineProps<{
  modelValue: string;
  label: string;
  hint?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const invalido = ref(false);

const hexParaInput = computed(() => {
  const n = normalizarHexColor(props.modelValue);
  return n ?? '#336699';
});

function onPicker(e: Event) {
  invalido.value = false;
  emit('update:modelValue', (e.target as HTMLInputElement).value.toLowerCase());
}

function onTexto(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const n = normalizarHexColor(raw);
  invalido.value = raw.trim().length > 0 && !n;
  emit('update:modelValue', n ?? raw);
}
</script>
