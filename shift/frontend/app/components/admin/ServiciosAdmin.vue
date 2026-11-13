<template>
  <div
    class="grid gap-6"
    :class="servicioIdFijo ? '' : 'lg:grid-cols-[minmax(220px,280px)_1fr]'"
  >
    <div
      v-if="!servicioIdFijo && personaStore.isSuperAdmin"
      class="rounded-xl border border-shift-border bg-shift-card p-4"
    >
      <h2 class="text-lg font-semibold">Servicios</h2>
      <form class="mt-3 flex gap-2" @submit.prevent="crearServicio">
        <input
          v-model="nuevoNombre"
          type="text"
          required
          placeholder="Nombre"
          class="min-w-0 flex-1 rounded-lg border border-shift-border bg-shift-bg px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          class="shrink-0 rounded-lg bg-shift-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
          :disabled="guardando"
        >
          +
        </button>
      </form>
      <p v-if="errorLista" class="mt-2 text-xs text-red-400">{{ errorLista }}</p>
      <p v-if="cargandoLista" class="mt-4 text-sm text-shift-muted">Cargando…</p>
      <ul v-else class="mt-4 max-h-[28rem] space-y-1 overflow-y-auto">
        <li v-if="!servicios.length" class="py-4 text-center text-sm text-shift-muted">
          Sin servicios
        </li>
        <li v-for="s in servicios" :key="s.id">
          <button
            type="button"
            class="w-full rounded-lg border px-3 py-2 text-left text-sm transition"
            :class="
              seleccionadoId === s.id
                ? 'border-shift-accent bg-shift-accent/10'
                : 'border-transparent hover:border-shift-border hover:bg-shift-bg/50'
            "
            @click="seleccionar(s.id)"
          >
            <span class="font-medium">{{ s.nombre }}</span>
            <span class="mt-0.5 block text-xs text-shift-muted">
              {{ countPersonas(s) }} empleado(s)
              <span v-if="!s.activo"> · inactivo</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <div
      v-if="detalle"
      class="rounded-xl border border-shift-border bg-shift-card p-6"
    >
      <h3 class="text-lg font-semibold">Detalle del servicio</h3>

      <form
        v-if="personaStore.isSuperAdmin"
        class="mt-4 space-y-4"
        @submit.prevent="guardarServicio"
      >
        <div>
          <label class="mb-1 block text-xs text-shift-muted">Nombre</label>
          <input
            v-model="formServicio.nombre"
            type="text"
            required
            class="w-full max-w-md rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
          />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="rounded px-2 py-0.5 text-xs"
            :class="
              formServicio.activo
                ? 'bg-emerald-900/40 text-emerald-200'
                : 'bg-shift-border text-shift-muted'
            "
          >
            {{ formServicio.activo ? 'Activo' : 'Inactivo' }}
          </span>
          <button
            v-if="formServicio.activo && puedeDesactivarServicio"
            type="button"
            class="btn-admin-muted"
            :disabled="guardando"
            @click="pedirDesactivarServicio"
          >
            Desactivar servicio
          </button>
          <button
            v-else-if="!formServicio.activo"
            type="button"
            class="btn-admin-primary"
            :disabled="guardando"
            @click="activarServicio"
          >
            Activar servicio
          </button>
          <button
            v-if="puedeEliminarServicio"
            type="button"
            class="btn-admin-danger"
            :disabled="guardando"
            @click="pedirEliminarServicio"
          >
            Eliminar servicio
          </button>
        </div>
        <p v-if="formServicio.activo && !puedeDesactivarServicio" class="text-xs text-amber-400">
          Hay {{ detalle.personasActivas }} empleado(s) activo(s). Reasignalos a otro servicio (columna
          Servicio al editar) antes de desactivar o eliminar.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            class="rounded-lg bg-shift-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            :disabled="guardando"
          >
            Guardar nombre
          </button>
          <button
            type="button"
            class="btn-admin-muted"
            :disabled="guardando"
            @click="abrirNuevoEmpleado"
          >
            Nuevo empleado
          </button>
        </div>
      </form>

      <div v-else class="mt-4">
        <p class="text-sm font-medium">{{ detalle.nombre }}</p>
        <button
          type="button"
          class="btn-admin-primary mt-3"
          :disabled="guardando"
          @click="abrirNuevoEmpleado"
        >
          Nuevo empleado
        </button>
      </div>

      <form
        v-if="panelNuevoEmpleado"
        class="mt-6 space-y-4 rounded-lg border border-shift-accent/30 bg-shift-bg/40 p-4 sm:p-5"
        @submit.prevent="crearEmpleado"
      >
        <h4 class="text-sm font-semibold text-shift-accent">Nuevo empleado</h4>
        <p class="text-xs text-shift-muted">
          Servicio: <span class="text-white">{{ detalle.nombre }}</span>
        </p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Legajo</label>
            <input
              v-model.number="formNuevo.legajo"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs text-shift-muted">Nombre</label>
            <input
              v-model="formNuevo.nombre"
              type="text"
              required
              maxlength="30"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Función</label>
            <select
              v-model.number="formNuevo.funcionId"
              required
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            >
              <option v-for="f in funcionesActivas" :key="f.id" :value="f.id">
                {{ f.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-shift-muted">Rol</label>
            <select
              v-model="formNuevo.rol"
              class="w-full rounded-lg border border-shift-border bg-shift-bg px-3 py-2 text-sm"
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN_SERVICIO">Administrador de servicio</option>
            </select>
          </div>
        </div>
        <div class="flex flex-wrap justify-end gap-2 border-t border-shift-border/60 pt-4">
          <button type="button" class="btn-admin-muted" :disabled="guardando" @click="cerrarNuevoEmpleado">
            Cancelar
          </button>
          <button type="submit" class="btn-admin-primary" :disabled="guardando">
            {{ guardando ? 'Guardando…' : 'Dar de alta' }}
          </button>
        </div>
      </form>

      <h4 class="mt-8 text-sm font-medium">
        Empleados ({{ detalle.personas.length }})
      </h4>
      <p class="mt-1 text-xs text-shift-muted">
        Presioná Editar para cambiar datos, rol de administrador o eliminar empleados sin eventos.
      </p>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr class="border-b border-shift-border text-shift-muted">
              <th class="pb-2 pr-3">Legajo</th>
              <th class="pb-2 pr-3">Nombre</th>
              <th class="pb-2 pr-3">Función</th>
              <th class="pb-2 pr-3">Servicio</th>
              <th class="pb-2 pr-3">Rol</th>
              <th class="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!detalle.personas.length">
              <td colspan="6" class="py-6 text-center text-shift-muted">
                Sin empleados en este servicio
              </td>
            </tr>
            <tr
              v-for="p in detalle.personas"
              :key="p.id"
              class="border-b border-shift-border/40"
            >
              <td class="py-2 pr-3 font-mono text-xs">
                {{ p.legajo }}
                <span v-if="!p.activo" class="ml-1 text-[10px] text-shift-muted">(baja)</span>
              </td>
              <td class="py-2 pr-3" :class="!p.activo ? 'opacity-60' : ''">
                <input
                  v-if="editPersonaId === p.id"
                  v-model="formPersona.nombre"
                  type="text"
                  maxlength="30"
                  class="w-full rounded border border-shift-border bg-shift-bg px-2 py-1"
                />
                <span v-else>{{ p.nombre }}</span>
              </td>
              <td class="py-2 pr-3">
                <select
                  v-if="editPersonaId === p.id"
                  v-model.number="formPersona.funcionId"
                  class="w-full rounded border border-shift-border bg-shift-bg px-2 py-1 text-sm"
                >
                  <option v-for="f in funcionesActivas" :key="f.id" :value="f.id">
                    {{ f.nombre }}
                  </option>
                </select>
                <span v-else>{{ p.funcion.nombre }}</span>
              </td>
              <td class="py-2 pr-3">
                <select
                  v-if="editPersonaId === p.id && personaStore.isSuperAdmin"
                  v-model.number="formPersona.servicioId"
                  class="w-full min-w-[8rem] rounded border border-shift-border bg-shift-bg px-2 py-1 text-sm"
                >
                  <option v-for="s in serviciosActivos" :key="s.id" :value="s.id">
                    {{ s.nombre }}
                  </option>
                </select>
                <span v-else>{{ p.servicio?.nombre ?? detalle?.nombre ?? '—' }}</span>
              </td>
              <td class="py-2 pr-3">
                <label
                  v-if="editPersonaId === p.id && p.rol !== 'SUPER_ADMIN'"
                  class="inline-flex items-center gap-2"
                  :class="
                    p.id === personaStore.persona?.id
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  "
                  :title="
                    p.id === personaStore.persona?.id ? 'No podés cambiar tu propio rol' : ''
                  "
                >
                  <span class="text-xs text-shift-muted">Admin</span>
                  <span class="relative inline-flex h-5 w-9 shrink-0">
                    <input
                      type="checkbox"
                      class="peer sr-only"
                      :checked="formPersona.rol === 'ADMIN_SERVICIO'"
                      :disabled="p.id === personaStore.persona?.id"
                      @change="onAdminSwitch($event)"
                    />
                    <span
                      class="admin-switch-track absolute inset-0 rounded-full border border-shift-border bg-shift-bg transition peer-focus-visible:ring-2 peer-disabled:opacity-60"
                      aria-hidden="true"
                    />
                    <span
                      class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-shift-muted transition peer-checked:translate-x-4 peer-checked:bg-shift-accent"
                      aria-hidden="true"
                    />
                  </span>
                </label>
                <span
                  v-else
                  class="rounded px-2 py-0.5 text-xs"
                  :class="
                    p.rol === 'ADMIN_SERVICIO' || p.rol === 'SUPER_ADMIN'
                      ? 'bg-shift-accent/20 text-shift-accent'
                      : 'bg-shift-border text-shift-muted'
                  "
                >
                  {{ rolEtiqueta(p.rol) }}
                </span>
              </td>
              <td class="py-2">
                <div class="flex flex-wrap gap-1.5">
                  <template v-if="editPersonaId === p.id">
                    <button type="button" class="btn-admin-primary" @click="guardarPersona(p.id)">
                      Guardar
                    </button>
                    <button type="button" class="btn-admin-muted" @click="cancelarPersona">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="btn-admin-danger"
                      :disabled="p.id === personaStore.persona?.id"
                      :title="p.id === personaStore.persona?.id ? 'No podés eliminarte' : ''"
                      @click="eliminarPersona(p)"
                    >
                      Eliminar
                    </button>
                  </template>
                  <template v-else>
                    <button type="button" class="btn-admin-primary" @click="editarPersona(p)">
                      Editar
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-else-if="!cargandoLista"
      class="flex items-center justify-center rounded-xl border border-dashed border-shift-border p-12 text-sm text-shift-muted"
    >
      Seleccioná un servicio de la lista
    </div>
  </div>
  <p v-if="errorDetalle" class="mt-3 text-sm text-red-400">{{ errorDetalle }}</p>

  <ShiftConfirmDialog
    :open="confirmDesactivarOpen"
    titulo="Desactivar servicio"
    :mensaje="mensajeConfirmDesactivar"
    etiqueta-confirmar="Sí, desactivar"
    variante="danger"
    @cancel="confirmDesactivarOpen = false"
    @confirm="ejecutarDesactivarServicio"
  />

  <ShiftConfirmDialog
    :open="confirmEliminarOpen"
    titulo="Eliminar servicio"
    :mensaje="mensajeConfirmEliminar"
    etiqueta-confirmar="Sí, eliminar"
    variante="danger"
    @cancel="confirmEliminarOpen = false"
    @confirm="ejecutarEliminarServicio"
  />
</template>

<script setup lang="ts">
import type { Funcion, Persona, Rol, Servicio } from '~/types';
import { rolEtiqueta } from '~/stores/persona';
import { apiErrorMessage } from '~/utils/api-error';
import { validarNombrePersona } from '~/utils/persona-nombre';

const props = defineProps<{
  /** Si se define, solo gestiona empleados de ese servicio (admin de servicio). */
  servicioIdFijo?: number;
}>();

type ServicioRow = Servicio & { _count?: { personas: number } };

interface ServicioDetalle extends Servicio {
  _count: { personas: number };
  personasActivas: number;
  personas: Persona[];
}

const { api } = useApi();
const personaStore = usePersonaStore();

const servicios = ref<ServicioRow[]>([]);
const funcionesActivas = ref<Funcion[]>([]);
const detalle = ref<ServicioDetalle | null>(null);
const seleccionadoId = ref<number | null>(null);
const cargandoLista = ref(true);
const guardando = ref(false);
const errorLista = ref('');
const errorDetalle = ref('');
const nuevoNombre = ref('');
const formServicio = reactive({ nombre: '', activo: true });
const editPersonaId = ref<number | null>(null);
const panelNuevoEmpleado = ref(false);
const formPersona = reactive<{ nombre: string; funcionId: number; servicioId: number; rol: Rol }>({
  nombre: '',
  funcionId: 0,
  servicioId: 0,
  rol: 'USER',
});
const formNuevo = reactive<{
  legajo: number | null;
  nombre: string;
  funcionId: number;
  rol: Rol;
}>({
  legajo: null,
  nombre: '',
  funcionId: 0,
  rol: 'USER',
});

const confirmDesactivarOpen = ref(false);
const confirmEliminarOpen = ref(false);

const serviciosActivos = computed(() => servicios.value.filter((s) => s.activo));

const puedeDesactivarServicio = computed(
  () => !!detalle.value && detalle.value.personasActivas === 0,
);

const puedeEliminarServicio = computed(
  () => !!detalle.value && detalle.value.personas.length === 0,
);

const mensajeConfirmDesactivar = computed(() => {
  const n = detalle.value?.nombre ?? 'este servicio';
  return `¿Desactivar «${n}»? No aparecerá en registro ni en nuevas altas. Los empleados deben estar reasignados antes.`;
});

const mensajeConfirmEliminar = computed(() => {
  const n = detalle.value?.nombre ?? 'este servicio';
  return `¿Eliminar definitivamente «${n}»? Solo es posible si no tiene empleados ni comentarios del mes guardados.`;
});

function countPersonas(s: ServicioRow): number {
  return s._count?.personas ?? 0;
}

async function cargarFunciones(servicioId: number) {
  funcionesActivas.value = await api<Funcion[]>(
    `/funciones?servicioId=${servicioId}&activo=true`,
  );
}

async function cargarLista() {
  cargandoLista.value = true;
  errorLista.value = '';
  try {
    const sv = await api<ServicioRow[]>('/servicios');
    servicios.value = sv;
    if (props.servicioIdFijo) {
      await seleccionar(props.servicioIdFijo);
    } else if (!seleccionadoId.value && sv.length) {
      await seleccionar(sv[0]!.id);
    }
  } catch (e: unknown) {
    errorLista.value = apiErrorMessage(e);
  } finally {
    cargandoLista.value = false;
  }
}

function cerrarNuevoEmpleado() {
  panelNuevoEmpleado.value = false;
}

function abrirNuevoEmpleado() {
  if (!detalle.value) return;
  editPersonaId.value = null;
  panelNuevoEmpleado.value = true;
  formNuevo.legajo = null;
  formNuevo.nombre = '';
  formNuevo.rol = 'USER';
  formNuevo.funcionId = funcionesActivas.value[0]?.id ?? 0;
  errorDetalle.value = '';
}

async function crearEmpleado() {
  if (!detalle.value) return;
  const legajo = formNuevo.legajo;
  if (legajo == null || !Number.isInteger(legajo) || legajo < 1) {
    errorDetalle.value = 'Ingrese un legajo válido';
    return;
  }
  if (!formNuevo.nombre.trim()) {
    errorDetalle.value = 'Ingrese el nombre';
    return;
  }
  const msgNombre = validarNombrePersona(formNuevo.nombre);
  if (msgNombre) {
    errorDetalle.value = msgNombre;
    return;
  }
  if (!formNuevo.funcionId) {
    errorDetalle.value = 'Seleccioná una función';
    return;
  }

  if (formNuevo.rol === 'ADMIN_SERVICIO') {
    const ok = confirm(
      `¿Dar de alta a ${formNuevo.nombre.trim()} (legajo ${legajo}) como administrador de este servicio?`,
    );
    if (!ok) return;
  }

  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api('/personas', {
      method: 'POST',
      body: {
        legajo,
        nombre: formNuevo.nombre.trim(),
        funcionId: formNuevo.funcionId,
        servicioId: detalle.value.id,
        rol: formNuevo.rol,
      },
    });
    cerrarNuevoEmpleado();
    await seleccionar(detalle.value.id);
    if (!props.servicioIdFijo) {
      await cargarLista();
    }
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function seleccionar(id: number) {
  seleccionadoId.value = id;
  errorDetalle.value = '';
  editPersonaId.value = null;
  cerrarNuevoEmpleado();
  try {
    await cargarFunciones(id);
    detalle.value = await api<ServicioDetalle>(`/servicios/${id}`);
    formServicio.nombre = detalle.value.nombre;
    formServicio.activo = detalle.value.activo;
    editPersonaId.value = null;
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
    detalle.value = null;
  }
}

async function crearServicio() {
  guardando.value = true;
  errorLista.value = '';
  try {
    const created = await api<ServicioRow>('/servicios', {
      method: 'POST',
      body: { nombre: nuevoNombre.value.trim() },
    });
    nuevoNombre.value = '';
    await cargarLista();
    await seleccionar(created.id);
  } catch (e: unknown) {
    errorLista.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function guardarServicio() {
  if (!detalle.value) return;
  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api(`/servicios/${detalle.value.id}`, {
      method: 'PATCH',
      body: { nombre: formServicio.nombre.trim() },
    });
    await cargarLista();
    await seleccionar(detalle.value.id);
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

function pedirDesactivarServicio() {
  if (!puedeDesactivarServicio.value) return;
  confirmDesactivarOpen.value = true;
}

async function ejecutarDesactivarServicio() {
  if (!detalle.value) return;
  confirmDesactivarOpen.value = false;
  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api(`/servicios/${detalle.value.id}`, {
      method: 'PATCH',
      body: { activo: false },
    });
    await cargarLista();
    await seleccionar(detalle.value.id);
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function activarServicio() {
  if (!detalle.value) return;
  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api(`/servicios/${detalle.value.id}`, {
      method: 'PATCH',
      body: { activo: true },
    });
    await cargarLista();
    await seleccionar(detalle.value.id);
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

function pedirEliminarServicio() {
  if (!puedeEliminarServicio.value) return;
  confirmEliminarOpen.value = true;
}

async function ejecutarEliminarServicio() {
  if (!detalle.value) return;
  confirmEliminarOpen.value = false;
  const id = detalle.value.id;
  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api(`/servicios/${id}`, { method: 'DELETE' });
    detalle.value = null;
    seleccionadoId.value = null;
    await cargarLista();
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

function editarPersona(p: Persona) {
  cerrarNuevoEmpleado();
  editPersonaId.value = p.id;
  formPersona.nombre = p.nombre;
  formPersona.funcionId = p.funcionId;
  formPersona.servicioId = p.servicioId;
  formPersona.rol = p.rol;
}

function onAdminSwitch(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  formPersona.rol = checked ? 'ADMIN_SERVICIO' : 'USER';
}

function cancelarPersona() {
  editPersonaId.value = null;
}

async function guardarPersona(id: number) {
  const original = detalle.value?.personas.find((x) => x.id === id);
  if (!original) return;

  const msgNombre = validarNombrePersona(formPersona.nombre);
  if (msgNombre) {
    errorDetalle.value = msgNombre;
    return;
  }

  if (formPersona.rol !== original.rol) {
    const msg =
      formPersona.rol === 'ADMIN_SERVICIO'
        ? `¿Dar rol de administrador de servicio a ${original.nombre} (legajo ${original.legajo})?`
        : `¿Quitar rol de administrador de servicio a ${original.nombre} (legajo ${original.legajo})?`;
    if (!confirm(msg)) return;
  }

  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api(`/personas/${id}`, {
      method: 'PATCH',
      body: {
        nombre: formPersona.nombre.trim(),
        funcionId: formPersona.funcionId,
        ...(personaStore.isSuperAdmin
          ? { servicioId: formPersona.servicioId }
          : { servicioId: detalle.value?.id }),
        rol: formPersona.rol === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : formPersona.rol,
      },
    });
    cancelarPersona();
    if (seleccionadoId.value) {
      await seleccionar(seleccionadoId.value);
    }
    await cargarLista();
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

async function eliminarPersona(p: Persona) {
  if (
    !confirm(
      `¿Eliminar a ${p.nombre} (legajo ${p.legajo})? Solo es posible si no tiene eventos registrados.`,
    )
  ) {
    return;
  }
  guardando.value = true;
  errorDetalle.value = '';
  try {
    await api(`/personas/${p.id}`, { method: 'DELETE' });
    if (seleccionadoId.value) {
      await seleccionar(seleccionadoId.value);
    }
    await cargarLista();
  } catch (e: unknown) {
    errorDetalle.value = apiErrorMessage(e);
  } finally {
    guardando.value = false;
  }
}

watch(
  () => props.servicioIdFijo,
  (id) => {
    if (id) void seleccionar(id);
  },
);

onMounted(cargarLista);
</script>
