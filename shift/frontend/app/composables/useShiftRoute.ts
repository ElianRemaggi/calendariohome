/**
 * Navegación que respeta app.baseURL (/shift/) en cliente y middleware.
 */
export function useShiftRoute() {
  const router = useRouter();

  function to(path: string) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  function push(path: string) {
    return router.push(to(path));
  }

  function replace(path: string) {
    return router.replace(to(path));
  }

  function navigate(path: string, opts?: { replace?: boolean }) {
    return navigateTo(to(path), opts);
  }

  return { push, replace, navigate, to };
}
