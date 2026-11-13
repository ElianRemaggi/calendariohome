const STORAGE_KEY = 'shift-admin-servicio-activo';

/** Servicio seleccionado en panel admin (multi-servicio o super). */
export function useServicioActivo() {
  const personaStore = usePersonaStore();
  const activoId = ref<number | null>(null);

  function opcionesServicio(): { id: number; nombre: string }[] {
    const p = personaStore.persona;
    if (!p) return [];
    if (p.rol === 'SUPER_ADMIN') {
      return [];
    }
    if (p.rol === 'ADMIN_SERVICIO') {
      const ids = p.adminServicioIds ?? [];
      if (ids.length === 0 && p.servicio) {
        return [{ id: p.servicio.id, nombre: p.servicio.nombre }];
      }
      return ids.map((id) => {
        if (id === p.servicio.id) {
          return { id, nombre: p.servicio.nombre };
        }
        return { id, nombre: `Servicio #${id}` };
      });
    }
    return [{ id: p.servicio.id, nombre: p.servicio.nombre }];
  }

  function resolverIdPorDefecto(): number | null {
    const p = personaStore.persona;
    if (!p) return null;
    if (p.rol === 'SUPER_ADMIN') return null;
    const ids = p.adminServicioIds ?? [];
    if (ids.length) return ids[0] ?? null;
    return p.servicioId;
  }

  function hydrate() {
    if (!import.meta.client) return;
    const guardado = sessionStorage.getItem(STORAGE_KEY);
    const parsed = guardado ? Number(guardado) : NaN;
    const def = resolverIdPorDefecto();
    if (Number.isInteger(parsed) && parsed > 0) {
      if (personaStore.isSuperAdmin || personaStore.canAdminServicio(parsed)) {
        activoId.value = parsed;
        return;
      }
    }
    activoId.value = def;
    if (def !== null) {
      sessionStorage.setItem(STORAGE_KEY, String(def));
    }
  }

  function setActivo(id: number | null) {
    activoId.value = id;
    if (!import.meta.client) return;
    if (id === null) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, String(id));
    }
  }

  onMounted(() => {
    personaStore.hydrate();
    hydrate();
  });

  watch(
    () => personaStore.persona?.id,
    () => hydrate(),
  );

  return {
    activoId,
    opcionesServicio,
    hydrate,
    setActivo,
    resolverIdPorDefecto,
  };
}
