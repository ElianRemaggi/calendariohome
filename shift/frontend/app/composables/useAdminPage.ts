export function useAdminPage() {
  const personaStore = usePersonaStore();
  const { replace } = useShiftRoute();

  onMounted(() => {
    personaStore.hydrate();
    if (!personaStore.isAdmin) {
      replace('/calendario');
    }
  });

  return { personaStore };
}
