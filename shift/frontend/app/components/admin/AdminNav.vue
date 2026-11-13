<template>
  <nav class="flex flex-wrap gap-1 border-b border-shift-border pb-3">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="rounded-lg px-3 py-1.5 text-sm text-shift-muted hover:bg-shift-border hover:text-white"
      :class="navIsActive(item) ? '!bg-shift-border !text-white' : ''"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const { itemsForRoute, isActive } = useAdminNavItems();

const items = computed(() => itemsForRoute(route));

function navIsActive(item: { to: string; label: string }) {
  return isActive(item, route);
}
</script>
