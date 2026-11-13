<template>
  <AdminShell>
    <h1 class="text-xl font-semibold">Funciones globales</h1>
    <p class="mt-2 text-sm text-shift-muted">
      Compartidas entre todos los servicios. Las funciones propias de cada servicio se gestionan
      desde Servicios → [servicio] → Funciones.
    </p>
    <div class="mt-6">
      <AdminFuncionesAdmin />
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
