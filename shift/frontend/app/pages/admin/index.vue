<template>
  <AdminShell>
    <h1 class="text-xl font-semibold">Administración Shift</h1>
    <p class="mt-2 text-sm text-shift-muted">
      Gestión de catálogos y consulta de eventos del equipo. Los feriados se cargan desde el calendario.
    </p>

    <section
      class="mt-8 rounded-xl border border-shift-border bg-shift-card"
      aria-labelledby="equipo-hoy-titulo"
    >
      <div
        class="flex items-center gap-3 px-4 py-3.5"
        :class="equipoHoyAbierto ? 'border-b border-shift-border/60' : ''"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left hover:bg-shift-bg/40 -m-1 p-1"
          :aria-expanded="equipoHoyAbierto"
          aria-controls="equipo-hoy-contenido"
          @click="equipoHoyAbierto = !equipoHoyAbierto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4 shrink-0 text-shift-muted transition-transform"
            :class="equipoHoyAbierto ? 'rotate-90' : ''"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <div class="min-w-0 py-0.5 leading-snug">
            <h2 id="equipo-hoy-titulo" class="font-medium leading-tight">Equipo hoy</h2>
            <p class="mt-0.5 text-sm text-shift-muted">{{ fechaHoyEtiqueta }}</p>
            <p
              v-if="!equipoHoyAbierto && resumenHoy"
              class="mt-1 text-xs leading-tight text-shift-accent/90"
            >
              {{ resumenHoy }}
            </p>
          </div>
        </button>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <select
            v-if="personaStore.isSuperAdmin"
            v-model="servicioFiltroHoy"
            class="rounded-lg border border-shift-border bg-shift-bg px-2 py-1 text-xs text-white"
            @change="cargarEventosHoy"
          >
            <option :value="0">Todos los servicios</option>
            <option v-for="s in serviciosFiltro" :key="s.id" :value="s.id">
              {{ s.nombre }}
            </option>
          </select>
          <button
            type="button"
            class="rounded-lg border border-shift-border px-2.5 py-1 text-xs text-shift-muted hover:bg-shift-border disabled:opacity-50"
            :disabled="cargandoHoy"
            @click.stop="cargarEventosHoy"
          >
            {{ cargandoHoy ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <div
        v-show="equipoHoyAbierto"
        id="equipo-hoy-contenido"
        class="px-4 py-3.5"
      >
        <p v-if="errorHoy" class="text-sm text-red-400">{{ errorHoy }}</p>
        <p v-else-if="cargandoHoy" class="text-sm text-shift-muted">Cargando…</p>
        <p v-else-if="!gruposHoy.length" class="text-sm text-shift-muted">
          Nadie con evento activo hoy.
        </p>
        <ul v-else class="space-y-4">
          <li v-for="grupo in gruposHoy" :key="grupo.tipo">
            <p class="text-sm font-semibold tracking-wide text-shift-text">
              {{ grupo.tipo }} :
            </p>
            <ul class="mt-1.5 list-disc space-y-0.5 pl-5">
              <li
                v-for="emp in grupo.empleados"
                :key="emp.nombre"
                class="text-sm"
                :class="
                  emp.excesoCupo
                    ? 'text-amber-400 marker:text-amber-500/90'
                    : 'text-shift-muted marker:text-shift-muted'
                "
                :title="emp.excesoCupo ? 'Anotado con exceso de cupo' : undefined"
              >
                {{ emp.nombre }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </section>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="rounded-xl border border-shift-border bg-shift-card p-5 transition hover:border-shift-accent/50"
      >
        <h2 class="font-medium">{{ card.title }}</h2>
        <p class="mt-1 text-sm text-shift-muted">{{ card.desc }}</p>
      </NuxtLink>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import type { Evento } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';
import { eventoCoversDay, todayIsoArgentina } from '~/utils/fechas';

import type { Servicio } from '~/types';

definePageMeta({ layout: 'default' });
useAdminPage();

const personaStore = usePersonaStore();
const { activoId } = useServicioActivo();
const { api } = useApi();

const TZ = 'America/Argentina/Buenos_Aires';

const EQUIPO_HOY_ABIERTO_KEY = 'shift-admin-equipo-hoy-abierto';

const cargandoHoy = ref(false);
const errorHoy = ref('');
type EmpleadoHoy = { nombre: string; excesoCupo: boolean };
type GrupoHoy = { tipo: string; empleados: EmpleadoHoy[] };

const gruposHoy = ref<GrupoHoy[]>([]);
const equipoHoyAbierto = ref(false);
const serviciosFiltro = ref<Servicio[]>([]);
const servicioFiltroHoy = ref(0);

const resumenHoy = computed(() => {
  if (!gruposHoy.value.length) return '';
  const personas = gruposHoy.value.reduce((n, g) => n + g.empleados.length, 0);
  const tipos = gruposHoy.value.length;
  return `${personas} persona(s) en ${tipos} tipo(s) de evento`;
});

const fechaHoyEtiqueta = computed(() => {
  const raw = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return raw.charAt(0).toUpperCase() + raw.slice(1);
});

function agruparEventosHoy(eventos: Evento[]): GrupoHoy[] {
  const hoy = todayIsoArgentina();
  const porTipo = new Map<string, Map<string, boolean>>();

  for (const ev of eventos) {
    if (ev.estado !== 'ACTIVO' || !ev.persona) continue;
    if (!eventoCoversDay(ev, hoy)) continue;
    const tipo = ev.tipoEvento.nombre;
    if (!porTipo.has(tipo)) porTipo.set(tipo, new Map());
    const empleados = porTipo.get(tipo)!;
    const nombre = ev.persona.nombre;
    empleados.set(nombre, (empleados.get(nombre) ?? false) || ev.excesoCupo);
  }

  return [...porTipo.entries()]
    .map(([tipo, empleadosMap]) => ({
      tipo,
      empleados: [...empleadosMap.entries()]
        .map(([nombre, excesoCupo]) => ({ nombre, excesoCupo }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    }))
    .sort((a, b) => a.tipo.localeCompare(b.tipo, 'es'));
}

async function cargarEventosHoy() {
  cargandoHoy.value = true;
  errorHoy.value = '';
  const hoy = todayIsoArgentina();
  const month = hoy.slice(0, 7);
  try {
    const qs = new URLSearchParams({ month, desde: hoy, hasta: hoy });
    let sid = servicioFiltroHoy.value;
    if (!personaStore.isSuperAdmin) {
      sid = activoId.value ?? personaStore.persona?.servicioId ?? 0;
    }
    if (sid > 0) {
      qs.set('servicioId', String(sid));
    }
    const eventos = await api<Evento[]>(`/eventos?${qs}`);
    gruposHoy.value = agruparEventosHoy(eventos);
  } catch (e: unknown) {
    errorHoy.value = apiErrorMessage(e);
    gruposHoy.value = [];
  } finally {
    cargandoHoy.value = false;
  }
}

onMounted(async () => {
  if (import.meta.client) {
    const guardado = sessionStorage.getItem(EQUIPO_HOY_ABIERTO_KEY);
    if (guardado === '0') equipoHoyAbierto.value = false;
    if (guardado === '1') equipoHoyAbierto.value = true;
  }
  if (personaStore.isSuperAdmin) {
    try {
      serviciosFiltro.value = await api<Servicio[]>('/servicios?activo=true');
    } catch {
      serviciosFiltro.value = [];
    }
  } else {
    const sid = activoId.value ?? personaStore.persona?.servicioId;
    if (sid) servicioFiltroHoy.value = sid;
  }
  void cargarEventosHoy();
});

watch(equipoHoyAbierto, (abierto) => {
  if (!import.meta.client) return;
  sessionStorage.setItem(EQUIPO_HOY_ABIERTO_KEY, abierto ? '1' : '0');
});

const cards = computed(() => {
  if (personaStore.isSuperAdmin) {
    return [
      { to: '/admin/tipos-evento', title: 'Tipos de evento', desc: 'Plantillas y reglas base' },
      { to: '/admin/servicios', title: 'Servicios', desc: 'Alta y gestión por servicio' },
      { to: '/admin/funciones', title: 'Funciones globales', desc: 'Compartidas entre servicios' },
      { to: '/admin/eventos', title: 'Eventos del mes', desc: 'Vista global por mes' },
      { to: '/admin/exportaciones', title: 'Exportaciones', desc: 'Planilla Excel' },
    ];
  }
  const sid = activoId.value ?? personaStore.persona?.servicioId;
  return [
    { to: '/admin/mi-servicio', title: 'Mi servicio', desc: 'Accesos de administración' },
    ...(sid
      ? [
          {
            to: `/admin/servicios/${sid}`,
            title: 'Servicio',
            desc: 'Empleados, alta y roles',
          },
        ]
      : []),
    { to: '/admin/exportaciones', title: 'Exportaciones', desc: 'Planilla Excel' },
  ];
});
</script>
