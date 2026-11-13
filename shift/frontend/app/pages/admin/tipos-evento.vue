<template>
  <AdminShell>
    <AdminTiposEventoAdmin />
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useAdminPage();
const personaStore = usePersonaStore();
const { replace } = useShiftRoute();

onMounted(() => {
  if (!personaStore.isSuperAdmin) {
    replace('/admin/mi-servicio');
  }
});
</script>
