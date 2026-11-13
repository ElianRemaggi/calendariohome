<template>
  <div class="min-h-screen bg-shift-bg">
    <header
      v-if="personaStore.persona"
      class="border-b border-shift-border bg-shift-card/90 backdrop-blur"
    >
      <div class="mx-auto max-w-calendar px-4 py-3 lg:px-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-shift-muted">Shift</p>
            <p class="truncate font-medium">
              Legajo {{ personaStore.persona.legajo }}
              <span class="text-shift-muted"> — </span>
              {{ personaStore.persona.nombre }}
            </p>
          </div>
          <nav class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-shift-border px-2.5 py-1.5 text-xs text-shift-muted hover:bg-shift-border"
              :title="theme === 'dark' ? 'Modo día' : 'Modo noche'"
              @click="toggleTheme"
            >
              {{ theme === 'dark' ? '☀ Día' : '🌙 Noche' }}
            </button>
            <NuxtLink
              to="/calendario"
              class="rounded-lg px-3 py-1.5 text-sm hover:bg-shift-border"
              active-class="bg-shift-border font-medium"
            >
              Calendario
            </NuxtLink>
            <NuxtLink
              to="/perfil"
              class="rounded-lg px-3 py-1.5 text-sm hover:bg-shift-border"
              active-class="bg-shift-border font-medium"
            >
              Mi perfil
            </NuxtLink>
            <NuxtLink
              v-if="personaStore.isAdmin && !enSeccionAdmin"
              to="/admin"
              class="rounded-lg px-3 py-1.5 text-sm hover:bg-shift-border"
            >
              Admin
            </NuxtLink>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm text-shift-muted hover:bg-shift-border"
              @click="salir"
            >
              Salir
            </button>
          </nav>
        </div>
        <AdminNav v-if="enSeccionAdmin && personaStore.isAdmin" class="mt-3 border-b-0 pb-0" />
      </div>
    </header>
    <main class="mx-auto w-full max-w-calendar px-4 py-6 lg:px-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const personaStore = usePersonaStore();
const route = useRoute();
const { push } = useShiftRoute();
const { theme, hydrate: hydrateTheme, toggle: toggleTheme } = useTheme();

const enSeccionAdmin = computed(() => route.path.startsWith('/admin'));

onMounted(() => {
  personaStore.hydrate();
  hydrateTheme();
});

function salir() {
  personaStore.clear();
  push('/');
}
</script>
