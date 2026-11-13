<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const personaStore = usePersonaStore();
const { hydrate: hydrateTheme } = useTheme();

onMounted(() => {
  personaStore.hydrate();
  hydrateTheme();
});
</script>
