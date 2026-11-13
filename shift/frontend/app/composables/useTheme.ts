export type ShiftTheme = 'dark' | 'light';

const STORAGE_KEY = 'shift-theme';

export function useTheme() {
  const theme = useState<ShiftTheme>('shift-theme', () => 'dark');

  function apply(t: ShiftTheme) {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(STORAGE_KEY, t);
    }
    theme.value = t;
  }

  function hydrate() {
    if (!import.meta.client) return;
    const saved = localStorage.getItem(STORAGE_KEY) as ShiftTheme | null;
    if (saved === 'light' || saved === 'dark') {
      apply(saved);
      return;
    }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    apply(prefersLight ? 'light' : 'dark');
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, apply, hydrate, toggle };
}
