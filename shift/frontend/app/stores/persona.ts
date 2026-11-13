import { defineStore } from 'pinia';
import type { Persona, Rol } from '~/types';

const STORAGE_KEY = 'shift-persona';
const PENDING_LEGAJO_KEY = 'shift-pending-legajo';

export const usePersonaStore = defineStore('persona', {
  state: () => ({
    persona: null as Persona | null,
    pendingLegajo: null as number | null,
  }),

  getters: {
    isSuperAdmin: (s) => s.persona?.rol === 'SUPER_ADMIN',
    isServiceAdmin: (s) => s.persona?.rol === 'ADMIN_SERVICIO',
    isAdmin: (s) =>
      s.persona?.rol === 'SUPER_ADMIN' || s.persona?.rol === 'ADMIN_SERVICIO',
    legajoHeader: (s) => (s.persona ? String(s.persona.legajo) : ''),
    adminServicioIds: (s): number[] => s.persona?.adminServicioIds ?? [],
    canAdminServicio: (s) => (servicioId: number) => {
      if (s.persona?.rol === 'SUPER_ADMIN') return true;
      return (s.persona?.adminServicioIds ?? []).includes(servicioId);
    },
  },

  actions: {
    hydrate() {
      if (import.meta.client) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            this.persona = JSON.parse(raw) as Persona;
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        const pending = localStorage.getItem(PENDING_LEGAJO_KEY);
        if (pending) {
          this.pendingLegajo = Number(pending);
        }
      }
    },

    setPersona(persona: Persona) {
      this.persona = persona;
      this.pendingLegajo = null;
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
        localStorage.removeItem(PENDING_LEGAJO_KEY);
      }
    },

    setPendingLegajo(legajo: number) {
      this.pendingLegajo = legajo;
      if (import.meta.client) {
        localStorage.setItem(PENDING_LEGAJO_KEY, String(legajo));
      }
    },

    clear() {
      this.persona = null;
      this.pendingLegajo = null;
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PENDING_LEGAJO_KEY);
      }
    },
  },
});

export function rolEtiqueta(rol: Rol): string {
  if (rol === 'SUPER_ADMIN') return 'Super admin';
  if (rol === 'ADMIN_SERVICIO') return 'Admin servicio';
  return 'Usuario';
}
