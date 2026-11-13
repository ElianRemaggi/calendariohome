/** Activa vista Lun–Vie si el chat está abierto y el contenedor del calendario es estrecho. */
const COMPACT_WIDTH_PX = 920;

export function useCalendarCompact(
  containerRef: Ref<HTMLElement | null>,
  chatAbierto: Ref<boolean>,
) {
  const ancho = ref(0);
  let observer: ResizeObserver | null = null;

  const ocultarFinesDeSemana = computed(
    () =>
      chatAbierto.value &&
      ancho.value > 0 &&
      ancho.value < COMPACT_WIDTH_PX,
  );

  function medir(el: HTMLElement | null) {
    if (!el) {
      ancho.value = 0;
      return;
    }
    ancho.value = el.getBoundingClientRect().width;
  }

  function detach() {
    observer?.disconnect();
    observer = null;
  }

  function attach(el: HTMLElement | null) {
    detach();
    if (!import.meta.client || !el || typeof ResizeObserver === 'undefined') {
      medir(el);
      return;
    }
    observer = new ResizeObserver(() => medir(el));
    observer.observe(el);
    medir(el);
  }

  watch(
    containerRef,
    (el) => {
      attach(el);
    },
    { immediate: true },
  );

  watch(chatAbierto, () => {
    nextTick(() => medir(containerRef.value));
  });

  onUnmounted(detach);

  return { ocultarFinesDeSemana, anchoCalendario: readonly(ancho) };
}
