<template>
  <aside
    v-if="abierto"
    class="fixed z-40 flex flex-col border-shift-border bg-shift-card
      bottom-0 left-0 right-0 top-[var(--shift-header-h,4.25rem)] border-t
      xl:left-auto xl:right-[max(0px,calc((100vw-min(100vw,1820px))/2))] xl:w-[22rem]
      xl:border-l xl:border-t-0"
  >
      <div
        class="flex shrink-0 items-start justify-between gap-2 border-b border-shift-border px-4 py-3"
      >
        <div class="min-w-0">
          <h2 class="text-sm font-semibold">Comentarios</h2>
          <p class="mt-0.5 truncate text-xs text-shift-muted">
            {{ subtitulo }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-shift-muted hover:bg-shift-border disabled:opacity-50"
            aria-label="Actualizar comentarios"
            :disabled="cargando"
            @click="cargar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
              :class="cargando ? 'animate-spin' : ''"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-xs text-shift-muted hover:bg-shift-border"
            aria-label="Ocultar comentarios"
            @click="cerrar"
          >
            Ocultar
          </button>
        </div>
      </div>

      <div
        ref="listaRef"
        class="min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        <p v-if="cargando" class="text-sm text-shift-muted">Cargando…</p>
        <p v-else-if="error" class="text-sm text-red-400">{{ error }}</p>
        <ul v-if="comentarios.length" class="space-y-2">
          <li
            v-for="c in comentarios"
            :key="c.id"
            class="rounded-md border-2 px-2 py-1.5"
            :style="estiloBurbuja(c.personaId)"
          >
            <template v-if="editandoId === c.id">
              <textarea
                v-model="editarTexto"
                rows="3"
                maxlength="250"
                class="w-full resize-none rounded-lg border border-shift-border bg-shift-bg px-2 py-1.5 text-sm"
              />
              <p class="mt-1 text-right text-[10px] text-shift-muted">
                {{ editarTexto.length }}/250
              </p>
              <div class="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded px-2 py-1 text-xs text-shift-muted hover:bg-shift-border"
                  @click="cancelarEdicion"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="rounded bg-shift-accent px-2 py-1 text-xs text-white disabled:opacity-50"
                  :disabled="guardando || !editarTexto.trim()"
                  @click="guardarEdicion(c.id)"
                >
                  Guardar
                </button>
              </div>
            </template>
            <template v-else>
              <div
                v-if="c.respondidoA"
                class="mb-1.5 rounded border-l-2 border-shift-border/50 bg-black/10 py-1 pl-2 pr-1"
                :style="estiloCita(c.respondidoA.personaId)"
              >
                <p class="text-[0.65rem] font-semibold leading-tight opacity-90">
                  {{ c.respondidoA.persona.nombre }}
                </p>
                <p class="line-clamp-2 text-[0.7rem] leading-snug opacity-80">
                  {{ textoCita(c.respondidoA) }}
                </p>
              </div>
              <p
                v-else-if="c.respondidoAId"
                class="mb-1.5 border-l-2 border-shift-muted/40 pl-2 text-[0.7rem] italic opacity-60"
              >
                Comentario eliminado
              </p>
              <p class="mb-0.5 text-[0.7rem] font-semibold leading-none opacity-90">
                {{ c.persona.nombre }}:
              </p>
              <p
                v-if="c.texto?.trim()"
                class="whitespace-pre-wrap break-words text-[0.875rem] leading-snug"
              >
                {{ c.texto }}
              </p>
              <img
                v-if="c.imagenUrl && !imagenRota(c.id)"
                :src="c.imagenUrl"
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                class="mt-1 max-h-52 w-full max-w-full rounded object-contain"
                @load="scrollAlFinal"
                @error="marcarImagenRota(c.id)"
              />
              <p
                v-else-if="c.imagenUrl && imagenRota(c.id)"
                class="mt-1 text-xs opacity-75"
              >
                No se pudo cargar la imagen
              </p>
              <div class="mt-1 flex items-center justify-between gap-2">
                <p class="min-w-0 truncate text-[0.7rem] leading-none opacity-75">
                  {{ formatFecha(c.creadoEn) }}
                  <span v-if="fueEditado(c)"> · editado</span>
                </p>
                <div class="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    class="inline-flex h-6 w-6 items-center justify-center rounded opacity-70 hover:bg-black/10 hover:opacity-100"
                    aria-label="Responder comentario"
                    @click="iniciarRespuesta(c)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <polyline points="9 14 4 9 9 4" />
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                    </svg>
                  </button>
                  <button
                    v-if="puedeEditar(c)"
                    type="button"
                    class="inline-flex h-6 w-6 items-center justify-center rounded opacity-70 hover:bg-black/10 hover:opacity-100"
                    aria-label="Editar comentario"
                    @click="iniciarEdicion(c)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="puedeBorrar(c)"
                    type="button"
                    class="inline-flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-950/40"
                    aria-label="Eliminar comentario"
                    @click="borrar(c)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path
                        d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                      />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </li>
        </ul>
      </div>

      <form
        class="shrink-0 border-t border-shift-border bg-shift-card px-4 pb-3 pt-3"
        @submit.prevent="enviar"
      >
        <div
          v-if="mostrarInputMeme"
          class="mb-2 rounded-lg border border-shift-border bg-shift-bg/80 p-2"
        >
          <label class="mb-1 block text-xs text-shift-muted">
            URL del meme (.gif, .jpg, .png)
          </label>
          <input
            v-model="urlMemeInput"
            type="url"
            inputmode="url"
            placeholder="https://…/imagen.gif"
            class="w-full rounded border border-shift-border bg-shift-bg px-2 py-1.5 text-sm"
            @input="errorMeme = ''"
          />
          <p v-if="errorMeme" class="mt-1 text-xs text-red-400">{{ errorMeme }}</p>
          <img
            v-if="urlMemePreview"
            :src="urlMemePreview"
            alt=""
            class="mt-2 max-h-32 w-full max-w-full rounded object-contain"
            referrerpolicy="no-referrer"
          />
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="rounded px-2 py-1 text-xs text-shift-muted hover:bg-shift-border"
              @click="cerrarInputMeme"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded bg-shift-accent px-2 py-1 text-xs text-white disabled:opacity-50"
              :disabled="!urlMemePreview"
              @click="aplicarMeme"
            >
              Listo
            </button>
          </div>
        </div>

        <div v-else-if="nuevoImagenUrl" class="relative mb-2">
          <img
            :src="nuevoImagenUrl"
            alt=""
            class="max-h-32 w-full max-w-full rounded object-contain"
            referrerpolicy="no-referrer"
          />
          <button
            type="button"
            class="absolute right-1 top-1 rounded bg-shift-card/90 px-1.5 py-0.5 text-xs text-shift-muted hover:text-red-400"
            aria-label="Quitar imagen"
            @click="quitarMeme"
          >
            ✕
          </button>
        </div>

        <div
          v-if="respondiendoA"
          class="mb-2 rounded-lg border border-shift-border bg-shift-bg/80 py-1.5 pl-2 pr-1"
          :style="estiloCita(respondiendoA.personaId)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-[0.65rem] font-medium text-shift-accent">
                Respondiendo a {{ respondiendoA.persona.nombre }}
              </p>
              <p class="line-clamp-2 text-[0.75rem] text-shift-muted">
                {{ textoCita(respondiendoA) }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded p-0.5 text-shift-muted hover:text-red-400"
              aria-label="Cancelar respuesta"
              @click="cancelarRespuesta"
            >
              ✕
            </button>
          </div>
        </div>

        <label class="mb-1 block text-xs text-shift-muted">
          {{ respondiendoA ? 'Tu respuesta' : 'Nuevo comentario' }}
        </label>
        <textarea
          ref="textareaRef"
          v-model="nuevoTexto"
          rows="3"
          maxlength="250"
          :placeholder="
            respondiendoA
              ? 'Escribí tu respuesta…'
              : 'Escribí un comentario sobre este mes…'
          "
          class="w-full resize-none rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
        />
        <div class="mt-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-shift-border text-shift-muted hover:border-shift-accent/50 hover:text-shift-accent"
              :class="mostrarInputMeme ? 'border-shift-accent/50 text-shift-accent' : ''"
              aria-label="Adjuntar imagen"
              @click="toggleInputMeme"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
            <span class="text-[10px] text-shift-muted">{{ nuevoTexto.length }}/250</span>
          </div>
          <button
            type="submit"
            class="rounded-lg bg-shift-accent px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            :disabled="guardando || !puedeEnviar"
          >
            {{ guardando ? 'Enviando…' : 'Enviar' }}
          </button>
        </div>
      </form>
  </aside>
</template>

<script setup lang="ts">
import type { ComentarioMes, ComentarioMesCita } from '~/types';
import { formatMonthYearTitle } from '~/utils/fechas';
import { apiErrorMessage } from '~/utils/api-error';
import { bubbleStyleForPersona, preferenciaFromPersona } from '~/utils/persona-colors';
import { urlMemeNormalizada, validarUrlMeme } from '~/utils/meme-url';

const { theme } = useTheme();

const MAX_TEXTO = 250;

const props = defineProps<{
  month: string;
  servicioId: number;
  servicioNombre?: string;
}>();

const abierto = defineModel<boolean>('abierto', { default: false });

const { api } = useApi();
const personaStore = usePersonaStore();

const comentarios = ref<ComentarioMes[]>([]);
const cargando = ref(false);
const guardando = ref(false);
const error = ref('');
const nuevoTexto = ref('');
const nuevoImagenUrl = ref('');
const mostrarInputMeme = ref(false);
const urlMemeInput = ref('');
const errorMeme = ref('');
const imagenesRotas = ref(new Set<number>());
const editandoId = ref<number | null>(null);
const editarTexto = ref('');
const respondiendoA = ref<ComentarioMes | null>(null);
const listaRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const urlMemePreview = computed(() => {
  const url = urlMemeNormalizada(urlMemeInput.value);
  return url ?? null;
});

const puedeEnviar = computed(
  () =>
    (nuevoTexto.value.trim().length > 0 || !!nuevoImagenUrl.value) &&
    !guardando.value,
);

const subtitulo = computed(() => {
  const mes = formatMonthYearTitle(props.month);
  const svc = props.servicioNombre?.trim();
  return svc ? `${svc} · ${mes}` : mes;
});

const personaIdsEnChat = computed(() => {
  const ids = new Set<number>();
  for (const c of comentarios.value) {
    ids.add(c.personaId);
  }
  return [...ids].sort((a, b) => a - b);
});

const preferenciaPorPersona = computed(() => {
  const map = new Map<number, ReturnType<typeof preferenciaFromPersona>>();
  for (const c of comentarios.value) {
    if (c.persona && !map.has(c.personaId)) {
      map.set(c.personaId, preferenciaFromPersona(c.persona));
    }
    const ref = c.respondidoA?.persona;
    if (ref && c.respondidoA && !map.has(c.respondidoA.personaId)) {
      map.set(c.respondidoA.personaId, preferenciaFromPersona(ref));
    }
  }
  return map;
});

/** Borde = fondo del chip; interior = mismo tono aclarado hacia blanco. */
function estiloBurbuja(personaId: number): Record<string, string> {
  const slot = personaIdsEnChat.value.indexOf(personaId);
  return bubbleStyleForPersona(
    personaId,
    theme.value,
    slot >= 0 ? slot : undefined,
    preferenciaPorPersona.value.get(personaId) ?? null,
  );
}

function estiloCita(personaId: number): Record<string, string> {
  const estilo = estiloBurbuja(personaId);
  const borde = estilo.borderColor ?? estilo.backgroundColor;
  return borde ? { borderLeftColor: borde } : {};
}

function textoCita(c: ComentarioMesCita | ComentarioMes): string {
  const t = c.texto?.trim();
  if (t) {
    return t.length > 120 ? `${t.slice(0, 120)}…` : t;
  }
  if (c.imagenUrl) return '(imagen)';
  return '(sin texto)';
}

function iniciarRespuesta(c: ComentarioMes) {
  cancelarEdicion();
  cerrarInputMeme();
  quitarMeme();
  respondiendoA.value = c;
  nuevoTexto.value = '';
  nextTick(() => textareaRef.value?.focus());
}

function cancelarRespuesta() {
  respondiendoA.value = null;
}

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function fueEditado(c: ComentarioMes): boolean {
  return new Date(c.actualizadoEn).getTime() > new Date(c.creadoEn).getTime() + 1000;
}

function puedeEditar(c: ComentarioMes): boolean {
  return personaStore.persona?.id === c.personaId;
}

function puedeBorrar(c: ComentarioMes): boolean {
  return puedeEditar(c) || personaStore.isAdmin;
}

function cerrar() {
  abierto.value = false;
}

function imagenRota(id: number): boolean {
  return imagenesRotas.value.has(id);
}

function marcarImagenRota(id: number) {
  imagenesRotas.value.add(id);
}

function toggleInputMeme() {
  mostrarInputMeme.value = !mostrarInputMeme.value;
  if (!mostrarInputMeme.value) {
    urlMemeInput.value = '';
    errorMeme.value = '';
  }
}

function cerrarInputMeme() {
  mostrarInputMeme.value = false;
  urlMemeInput.value = '';
  errorMeme.value = '';
}

function aplicarMeme() {
  const err = validarUrlMeme(urlMemeInput.value);
  if (err) {
    errorMeme.value = err;
    return;
  }
  const url = urlMemeNormalizada(urlMemeInput.value);
  if (!url) return;
  nuevoImagenUrl.value = url;
  cerrarInputMeme();
}

function quitarMeme() {
  nuevoImagenUrl.value = '';
}

/** Baja al último mensaje (tras pintar la lista; reintento por imágenes). */
async function scrollAlFinal() {
  await nextTick();
  const ir = () => {
    const el = listaRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  };
  requestAnimationFrame(() => requestAnimationFrame(ir));
  setTimeout(ir, 120);
  setTimeout(ir, 400);
}

async function cargar() {
  if (!props.servicioId || !props.month) return;
  cargando.value = true;
  error.value = '';
  try {
    comentarios.value = await api<ComentarioMes[]>(
      `/comentarios-mes?month=${encodeURIComponent(props.month)}&servicioId=${props.servicioId}`,
    );
    imagenesRotas.value = new Set();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    cargando.value = false;
    await scrollAlFinal();
  }
}

async function enviar() {
  const texto = nuevoTexto.value.trim();
  const imagenUrl = nuevoImagenUrl.value || undefined;
  if ((!texto && !imagenUrl) || texto.length > MAX_TEXTO) return;
  guardando.value = true;
  error.value = '';
  try {
    await api('/comentarios-mes', {
      method: 'POST',
      body: {
        month: props.month,
        servicioId: props.servicioId,
        ...(texto ? { texto } : {}),
        ...(imagenUrl ? { imagenUrl } : {}),
        ...(respondiendoA.value
          ? { respondidoAId: respondiendoA.value.id }
          : {}),
      },
    });
    nuevoTexto.value = '';
    nuevoImagenUrl.value = '';
    cancelarRespuesta();
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

function iniciarEdicion(c: ComentarioMes) {
  editandoId.value = c.id;
  editarTexto.value = c.texto;
}

function cancelarEdicion() {
  editandoId.value = null;
  editarTexto.value = '';
}

async function guardarEdicion(id: number) {
  const c = comentarios.value.find((x) => x.id === id);
  const texto = editarTexto.value.trim();
  if (!texto && !c?.imagenUrl) return;
  guardando.value = true;
  error.value = '';
  try {
    await api(`/comentarios-mes/${id}`, {
      method: 'PATCH',
      body: { texto },
    });
    cancelarEdicion();
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function borrar(c: ComentarioMes) {
  if (!import.meta.client) return;
  const ok = window.confirm('¿Eliminar este comentario?');
  if (!ok) return;
  guardando.value = true;
  error.value = '';
  try {
    await api(`/comentarios-mes/${c.id}`, { method: 'DELETE' });
    if (editandoId.value === c.id) cancelarEdicion();
    await cargar();
  } catch (e: unknown) {
    error.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

watch(
  () => [abierto.value, props.month, props.servicioId] as const,
  ([open, month, servicioId], prev) => {
    if (prev && (prev[1] !== month || prev[2] !== servicioId)) {
      cancelarEdicion();
      cancelarRespuesta();
      quitarMeme();
      cerrarInputMeme();
    }
    if (open && month && servicioId) void cargar();
  },
  { immediate: true },
);

</script>
