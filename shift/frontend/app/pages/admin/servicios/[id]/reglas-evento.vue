<template>
  <AdminShell>
    <AdminReglasEventoServicio v-if="servicioId" :servicio-id="servicioId" />
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useAdminPage();
const route = useRoute();
const personaStore = usePersonaStore();
const { replace } = useShiftRoute();

const servicioId = computed(() => Number(route.params.id));

onMounted(() => {
  const id = servicioId.value;
  if (!Number.isInteger(id) || !personaStore.canAdminServicio(id)) {
    replace('/admin/mi-servicio');
  }
});
</script>
