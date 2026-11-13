<template>
  <AdminShell>
    <h1 class="text-xl font-semibold">Servicio</h1>
    <div
      v-if="personaStore.isServiceAdmin && opciones.length > 1"
      class="mt-4 flex flex-wrap items-end gap-3"
    >
      <label class="text-sm text-shift-muted">
        Servicio activo
        <select
          :value="servicioId"
          class="ml-2 rounded-lg border border-shift-border bg-shift-bg px-3 py-1.5 text-sm text-white"
          @change="onCambioServicio"
        >
          <option v-for="o in opciones" :key="o.id" :value="o.id">{{ o.nombre }}</option>
        </select>
      </label>
    </div>
    <p class="mt-2 text-sm text-shift-muted">
      Empleados y configuración del servicio.
    </p>
    <div class="mt-6">
      <AdminServiciosAdmin v-if="servicioId" :servicio-id-fijo="servicioId" />
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useAdminPage();
const route = useRoute();
const personaStore = usePersonaStore();
const { activoId, opcionesServicio, setActivo, hydrate } = useServicioActivo();
const { replace } = useShiftRoute();

const opciones = computed(() => opcionesServicio());

const servicioId = computed(() => Number(route.params.id));

function onCambioServicio(e: Event) {
  const v = Number((e.target as HTMLSelectElement).value);
  if (v && v !== servicioId.value) {
    setActivo(v);
    replace(`/admin/servicios/${v}`);
  }
}

onMounted(() => {
  hydrate();
  const id = servicioId.value;
  if (!Number.isInteger(id) || id < 1) {
    replace('/admin/mi-servicio');
    return;
  }
  if (personaStore.isSuperAdmin) {
    replace('/admin/servicios');
    return;
  }
  if (!personaStore.canAdminServicio(id)) {
    replace('/admin/mi-servicio');
    return;
  }
  setActivo(id);
});
</script>
