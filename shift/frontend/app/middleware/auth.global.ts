export default defineNuxtRouteMiddleware((to) => {
  const personaStore = usePersonaStore();
  personaStore.hydrate();
  const { navigate } = useShiftRoute();

  const publicPaths = ['/', '/registro'];
  if (publicPaths.includes(to.path)) {
    return;
  }

  if (!personaStore.persona) {
    return navigate('/', { replace: true });
  }

  if (to.path.startsWith('/admin') && !personaStore.isAdmin) {
    return navigate('/calendario', { replace: true });
  }
});
