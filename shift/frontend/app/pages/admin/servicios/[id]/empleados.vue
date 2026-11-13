<template>
  <div class="text-sm text-shift-muted">Redirigiendo…</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
const route = useRoute();
const { replace } = useShiftRoute();

onMounted(() => {
  const id = Number(route.params.id);
  if (Number.isInteger(id) && id > 0) {
    replace(`/admin/servicios/${id}`);
  } else {
    replace('/admin/mi-servicio');
  }
});
</script>
