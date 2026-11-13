<template>
  <div class="mx-auto max-w-lg">
    <h1 class="text-xl font-semibold">Mi perfil</h1>
    <p class="mt-2 text-sm text-shift-muted">
      Datos visibles en el calendario y comentarios del equipo.
    </p>

    <form
      v-if="personaStore.persona"
      class="mt-6 space-y-6 rounded-xl border border-shift-border bg-shift-card p-6"
      @submit.prevent="guardar"
    >
      <dl class="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs text-shift-muted">Legajo</dt>
          <dd class="mt-0.5 font-mono">{{ personaStore.persona.legajo }}</dd>
        </div>
        <div>
          <dt class="text-xs text-shift-muted">Servicio</dt>
          <dd class="mt-0.5">{{ personaStore.persona.servicio?.nombre ?? '—' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs text-shift-muted">Función</dt>
          <dd class="mt-0.5">{{ personaStore.persona.funcion?.nombre ?? '—' }}</dd>
        </div>
      </dl>

      <div>
        <label class="mb-1 block text-xs text-shift-muted">Nombre en calendario</label>
        <input
          v-model="nombre"
          type="text"
          required
          maxlength="30"
          class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
        />
      </div>

      <section class="space-y-4">
        <div>
          <h2 class="text-sm font-medium">Apariencia en calendario y chat</h2>
          <p class="mt-1 text-xs text-shift-muted">
            El modo día/noche se cambia en la barra superior.
          </p>
        </div>

        <label
          class="flex cursor-pointer items-center gap-3 rounded-lg border border-shift-border/60 bg-shift-bg/40 px-3 py-2.5"
        >
          <input v-model="colorAutomatico" type="radio" :value="true" name="color-modo" />
          <span class="text-sm">Automático (según el orden del mes)</span>
        </label>
        <label
          class="flex cursor-pointer items-center gap-3 rounded-lg border border-shift-border/60 bg-shift-bg/40 px-3 py-2.5"
        >
          <input v-model="colorAutomatico" type="radio" :value="false" name="color-modo" />
          <span class="text-sm">Personalizar colores</span>
        </label>

        <template v-if="!colorAutomatico">
          <div class="rounded-lg border border-shift-border/60 bg-shift-bg/30 p-4 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-shift-muted">
              Fondo del chip
            </h3>
            <div>
              <label class="mb-1 block text-xs text-shift-muted">Tipo de fondo</label>
              <select
                v-model="patron"
                class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
              >
                <option value="LISO">Liso (color sólido)</option>
                <option value="RAYADO">Rayado</option>
                <option value="GRILLA">Grilla</option>
              </select>
            </div>
            <PerfilColorCampo
              v-model="fondo"
              label="Color de fondo"
              hint="Color base del chip o burbuja."
            />
            <PerfilColorCampo
              v-if="patron !== 'LISO'"
              v-model="patronColor"
              label="Color del patrón"
              hint="Rayas o líneas de la grilla sobre el fondo."
            />
          </div>

          <div class="rounded-lg border border-shift-border/60 bg-shift-bg/30 p-4">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-shift-muted">
              Texto interior
            </h3>
            <PerfilColorCampo
              v-model="texto"
              class="mt-3"
              label="Color del nombre"
              hint="Texto que aparece dentro del chip."
            />
          </div>

          <div class="rounded-lg border border-shift-border/60 bg-shift-bg/30 p-4">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-shift-muted">
              Borde
            </h3>
            <PerfilColorCampo
              v-model="borde"
              class="mt-3"
              label="Color del borde"
            />
          </div>

          <div v-if="vistaPrevia" class="flex flex-wrap items-center gap-2 text-xs text-shift-muted">
            <span>Vista previa:</span>
            <span
              class="rounded-md border-2 px-2 py-1 font-semibold uppercase"
              :style="vistaPrevia"
            >
              {{ nombre.trim() || 'Tu nombre' }}
            </span>
          </div>
        </template>
      </section>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <p v-if="ok" class="text-sm text-emerald-400">Perfil guardado.</p>

      <div class="flex flex-wrap gap-2 border-t border-shift-border/60 pt-4">
        <button type="submit" class="btn-admin-primary" :disabled="guardando">
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
        <NuxtLink to="/calendario" class="btn-admin-muted">Volver al calendario</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { PatronCalendario, Persona } from '~/types';
import { apiErrorMessage } from '~/utils/api-error';
import { validarNombrePersona } from '~/utils/persona-nombre';
import {
  chipStyleFromPreferencia,
  colorAutomaticoPorDefecto,
  normalizarHexColor,
  preferenciaFromPersona,
} from '~/utils/persona-colors';

definePageMeta({ layout: 'default' });

const personaStore = usePersonaStore();
const { replace } = useShiftRoute();
const { api } = useApi();
const { theme } = useTheme();

const nombre = ref('');
const colorAutomatico = ref(true);
const fondo = ref('#1d4ed8');
const texto = ref('#ffffff');
const borde = ref('#60a5fa');
const patron = ref<PatronCalendario>('LISO');
const patronColor = ref('#ffffff');
const guardando = ref(false);
const error = ref('');
const ok = ref(false);
/** Evita que el watch de colorAutomatico pise valores al cargar desde la persona. */
const sincronizandoFormulario = ref(false);

const vistaPrevia = computed(() => {
  if (colorAutomatico.value) return null;
  const f = normalizarHexColor(fondo.value);
  const t = normalizarHexColor(texto.value);
  const b = normalizarHexColor(borde.value);
  if (!f || !t || !b) return null;
  if (patron.value !== 'LISO' && !normalizarHexColor(patronColor.value)) return null;
  return chipStyleFromPreferencia({
    personalizado: true,
    fondo: f,
    texto: t,
    borde: b,
    patron: patron.value,
    patronColor:
      patron.value === 'LISO' ? null : normalizarHexColor(patronColor.value),
  });
});

function defaultsDesdeAutomatico(id: number) {
  const d = colorAutomaticoPorDefecto(id, theme.value);
  fondo.value = d.bg;
  texto.value = d.text;
  borde.value = d.border;
  patron.value = d.backgroundImage ? 'RAYADO' : 'LISO';
  patronColor.value = theme.value === 'dark' ? '#ffffff' : '#000000';
}

function aplicarColoresPersonalizados(p: Persona) {
  const pref = preferenciaFromPersona(p);
  if (!pref) return false;
  fondo.value = normalizarHexColor(pref.fondo!) ?? pref.fondo!;
  texto.value = normalizarHexColor(pref.texto!) ?? pref.texto!;
  borde.value = normalizarHexColor(pref.borde!) ?? pref.borde!;
  patron.value = pref.patron ?? 'LISO';
  patronColor.value = pref.patronColor
    ? normalizarHexColor(pref.patronColor) ?? pref.patronColor
    : theme.value === 'dark'
      ? '#ffffff'
      : '#000000';
  return true;
}

function cargarDesdePersona(p: Persona) {
  sincronizandoFormulario.value = true;
  nombre.value = p.nombre;
  if (p.colorCalendarioPersonalizado && aplicarColoresPersonalizados(p)) {
    colorAutomatico.value = false;
  } else {
    colorAutomatico.value = true;
    defaultsDesdeAutomatico(p.id);
  }
  sincronizandoFormulario.value = false;
}

function validarFormulario(): string | null {
  const msgNombre = validarNombrePersona(nombre.value);
  if (msgNombre) return msgNombre;
  if (colorAutomatico.value) return null;
  if (!normalizarHexColor(fondo.value)) return 'Color de fondo inválido';
  if (!normalizarHexColor(texto.value)) return 'Color del texto inválido';
  if (!normalizarHexColor(borde.value)) return 'Color del borde inválido';
  if (patron.value !== 'LISO' && !normalizarHexColor(patronColor.value)) {
    return 'Indicá el color del patrón (rayas o grilla)';
  }
  return null;
}

async function guardar() {
  const p = personaStore.persona;
  if (!p) return;
  const msg = validarFormulario();
  if (msg) {
    error.value = msg;
    return;
  }
  guardando.value = true;
  error.value = '';
  ok.value = false;
  try {
    const body = colorAutomatico.value
      ? { nombre: nombre.value.trim(), colorCalendarioPersonalizado: false }
      : {
          nombre: nombre.value.trim(),
          colorCalendarioPersonalizado: true,
          colorCalendarioFondo: normalizarHexColor(fondo.value),
          colorCalendarioTexto: normalizarHexColor(texto.value),
          colorCalendarioBorde: normalizarHexColor(borde.value),
          colorCalendarioPatron: patron.value,
          colorCalendarioPatronColor:
            patron.value === 'LISO'
              ? null
              : normalizarHexColor(patronColor.value),
        };

    const updated = await api<Persona>(`/personas/${p.id}`, {
      method: 'PATCH',
      body,
    });
    personaStore.setPersona({ ...p, ...updated });
    ok.value = true;
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

watch(colorAutomatico, (auto) => {
  if (sincronizandoFormulario.value || auto || !personaStore.persona) return;
  const p = personaStore.persona;
  if (!aplicarColoresPersonalizados(p)) {
    defaultsDesdeAutomatico(p.id);
  }
});

async function refrescarPersona() {
  const p = personaStore.persona;
  if (!p) return;
  try {
    const fresh = await api<Persona>(`/personas/by-legajo/${p.legajo}`);
    personaStore.setPersona(fresh);
    cargarDesdePersona(fresh);
  } catch {
    cargarDesdePersona(p);
  }
}

onMounted(async () => {
  personaStore.hydrate();
  if (!personaStore.persona) {
    replace('/');
    return;
  }
  await refrescarPersona();
});

watch(
  () => personaStore.persona,
  (p, prev) => {
    if (p && p.id !== prev?.id) cargarDesdePersona(p);
  },
);
</script>
