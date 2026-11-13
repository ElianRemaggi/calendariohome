export function useApi() {
  const config = useRuntimeConfig();
  const personaStore = usePersonaStore();

  const api = $fetch.create({
    baseURL: config.public.apiBase as string,
    onRequest({ options }) {
      const headers = new Headers(options.headers as HeadersInit);
      if (personaStore.persona?.legajo) {
        headers.set('X-Shift-Legajo', String(personaStore.persona.legajo));
      }
      options.headers = headers;
    },
  });

  return { api, apiBase: config.public.apiBase as string };
}
