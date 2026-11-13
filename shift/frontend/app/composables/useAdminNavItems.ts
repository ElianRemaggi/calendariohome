import type { RouteLocationNormalizedLoaded } from 'vue-router';

export type AdminNavItem = { to: string; label: string };

export function useAdminNavItems() {
  const personaStore = usePersonaStore();
  const { activoId } = useServicioActivo();

  function itemsForRoute(route?: RouteLocationNormalizedLoaded): AdminNavItem[] {
    const base: AdminNavItem[] = [{ to: '/admin', label: 'Inicio' }];
    if (personaStore.isSuperAdmin) {
      return [
        ...base,
        { to: '/admin/tipos-evento', label: 'Tipos de evento' },
        { to: '/admin/funciones', label: 'Funciones globales' },
        { to: '/admin/servicios', label: 'Servicios' },
        { to: '/admin/eventos', label: 'Eventos del mes' },
        { to: '/admin/exportaciones', label: 'Exportaciones' },
      ];
    }
    const sid = activoId.value ?? personaStore.persona?.servicioId;
    if (!sid) {
      return [...base, { to: '/admin/mi-servicio', label: 'Mi servicio' }];
    }
    return [
      ...base,
      { to: '/admin/mi-servicio', label: 'Mi servicio' },
      { to: `/admin/servicios/${sid}`, label: 'Servicio' },
      { to: `/admin/servicios/${sid}/funciones`, label: 'Funciones' },
      { to: `/admin/servicios/${sid}/reglas-evento`, label: 'Reglas eventos' },
      { to: '/admin/exportaciones', label: 'Exportaciones' },
    ];
  }

  function isActive(item: AdminNavItem, route: RouteLocationNormalizedLoaded): boolean {
    if (item.to === '/admin') {
      return route.path === '/admin' || route.path === '/admin/';
    }
    return route.path === item.to || route.path.startsWith(`${item.to}/`);
  }

  return { itemsForRoute, isActive };
}
