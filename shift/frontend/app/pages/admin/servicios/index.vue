<template>
  <AdminShell>
    <h1 class="text-xl font-semibold">Servicios</h1>
    <p class="mt-2 text-sm text-shift-muted">
      Creá servicios y gestioná empleados, funciones y reglas por cada uno.
    </p>
    <div class="mt-6">
      <AdminServiciosAdmin />
    </div>
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
