<template>
  <AdminShell>
    <h1 class="text-xl font-semibold">Mi servicio</h1>
    <div
      v-if="personaStore.isServiceAdmin && opciones.length > 1"
      class="mt-4 flex flex-wrap items-end gap-3"
    >
      <label class="text-sm text-shift-muted">
        Servicio activo
        <select
          :value="activoId ?? ''"
          class="ml-2 rounded-lg border border-shift-border bg-shift-bg px-3 py-1.5 text-sm text-white"
          @change="onCambioServicio"
        >
          <option v-for="o in opciones" :key="o.id" :value="o.id">{{ o.nombre }}</option>
        </select>
      </label>
    </div>
    <div v-if="servicioId" class="mt-6 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        :to="`/admin/servicios/${servicioId}`"
        class="rounded-xl border border-shift-border bg-shift-card p-5 transition hover:border-shift-accent/50"
      >
        <h2 class="font-medium">Servicio</h2>
        <p class="mt-1 text-sm text-shift-muted">Empleados, alta y roles del servicio</p>
      </NuxtLink>
      <NuxtLink
        :to="`/admin/servicios/${servicioId}/funciones`"
        class="rounded-xl border border-shift-border bg-shift-card p-5 transition hover:border-shift-accent/50"
      >
        <h2 class="font-medium">Funciones</h2>
        <p class="mt-1 text-sm text-shift-muted">Funciones propias del servicio</p>
      </NuxtLink>
      <NuxtLink
        :to="`/admin/servicios/${servicioId}/reglas-evento`"
        class="rounded-xl border border-shift-border bg-shift-card p-5 transition hover:border-shift-accent/50"
      >
        <h2 class="font-medium">Reglas de eventos</h2>
        <p class="mt-1 text-sm text-shift-muted">Cupo y restricciones por tipo de evento</p>
      </NuxtLink>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useAdminPage();
const personaStore = usePersonaStore();
const { activoId, opcionesServicio, setActivo, hydrate } = useServicioActivo();
const { replace } = useShiftRoute();

const opciones = computed(() => opcionesServicio());

const servicioId = computed(
  () => activoId.value ?? personaStore.persona?.servicioId ?? null,
);

function onCambioServicio(e: Event) {
  const v = Number((e.target as HTMLSelectElement).value);
  if (v) setActivo(v);
}

onMounted(() => {
  hydrate();
  if (personaStore.isSuperAdmin) {
    replace('/admin/servicios');
  }
});
</script>
