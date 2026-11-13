export interface PersonaColorStyle {
  bg: string;
  text: string;
  border: string;
  backgroundImage?: string;
}

export type PatronCalendario = 'LISO' | 'RAYADO' | 'GRILLA';

/** Preferencia guardada en perfil del empleado. */
export interface PersonaColorPreferencia {
  personalizado: boolean;
  fondo?: string | null;
  texto?: string | null;
  borde?: string | null;
  patron?: PatronCalendario | null;
  patronColor?: string | null;
}

/** Campos mínimos de Persona para resolver color. */
export type PersonaColorSource = {
  id: number;
  colorCalendarioPersonalizado?: boolean;
  colorCalendarioFondo?: string | null;
  colorCalendarioTexto?: string | null;
  colorCalendarioBorde?: string | null;
  colorCalendarioPatron?: PatronCalendario | null;
  colorCalendarioPatronColor?: string | null;
};

/** Máximo de empleados en planilla (slots únicos por vista automática). */
export const MAX_PERSONAS_COLOR = 15;

const PALETTE_DARK: PersonaColorStyle[] = [
  { bg: '#1d4ed8', text: '#ffffff', border: '#60a5fa' },
  { bg: '#c2410c', text: '#ffffff', border: '#fb923c' },
  { bg: '#15803d', text: '#ffffff', border: '#4ade80' },
  { bg: '#a21caf', text: '#ffffff', border: '#e879f9' },
  { bg: '#0e7490', text: '#ffffff', border: '#22d3ee' },
  { bg: '#a16207', text: '#fffbeb', border: '#facc15' },
  { bg: '#6d28d9', text: '#ffffff', border: '#a78bfa' },
  { bg: '#b91c1c', text: '#ffffff', border: '#f87171' },
  { bg: '#047857', text: '#ffffff', border: '#34d399' },
  { bg: '#be185d', text: '#ffffff', border: '#f472b6' },
  { bg: '#4338ca', text: '#ffffff', border: '#818cf8' },
  { bg: '#4d7c0f', text: '#ecfccb', border: '#a3e635' },
  { bg: '#0f766e', text: '#ffffff', border: '#2dd4bf' },
  { bg: '#9a3412', text: '#fff7ed', border: '#fdba74' },
  { bg: '#5b21b6', text: '#faf5ff', border: '#c4b5fd' },
];

const PALETTE_LIGHT: PersonaColorStyle[] = [
  { bg: '#93c5fd', text: '#1e3a8a', border: '#1d4ed8' },
  { bg: '#fdba74', text: '#7c2d12', border: '#c2410c' },
  { bg: '#86efac', text: '#14532d', border: '#15803d' },
  { bg: '#e879f9', text: '#701a75', border: '#a21caf' },
  { bg: '#22d3ee', text: '#164e63', border: '#0e7490' },
  { bg: '#fde047', text: '#713f12', border: '#a16207' },
  { bg: '#c4b5fd', text: '#4c1d95', border: '#6d28d9' },
  { bg: '#fca5a5', text: '#7f1d1d', border: '#b91c1c' },
  { bg: '#34d399', text: '#064e3b', border: '#047857' },
  { bg: '#f472b6', text: '#831843', border: '#be185d' },
  { bg: '#818cf8', text: '#312e81', border: '#4338ca' },
  { bg: '#a3e635', text: '#365314', border: '#4d7c0f' },
  { bg: '#5eead4', text: '#134e4a', border: '#0f766e' },
  { bg: '#fda4af', text: '#881337', border: '#e11d48' },
  { bg: '#ddd6fe', text: '#4c1d95', border: '#5b21b6' },
];

const PATTERN_COUNT = 3;

export const MAX_COLOR_SLOT = MAX_PERSONAS_COLOR * PATTERN_COUNT - 1;

export function preferenciaFromPersona(
  p?: PersonaColorSource | null,
): PersonaColorPreferencia | null {
  if (!p?.colorCalendarioPersonalizado) return null;
  if (!p.colorCalendarioFondo || !p.colorCalendarioTexto || !p.colorCalendarioBorde) {
    return null;
  }
  return {
    personalizado: true,
    fondo: p.colorCalendarioFondo,
    texto: p.colorCalendarioTexto,
    borde: p.colorCalendarioBorde,
    patron: (p.colorCalendarioPatron as PatronCalendario) ?? 'LISO',
    patronColor: p.colorCalendarioPatronColor,
  };
}

export function colorAutomaticoPorDefecto(
  personaId: number,
  theme: 'dark' | 'light' = 'dark',
): PersonaColorStyle {
  return colorForPersona(personaId, theme);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0], 16),
      parseInt(h[1]! + h[1], 16),
      parseInt(h[2]! + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

export function normalizarHexColor(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  const withHash = t.startsWith('#') ? t : `#${t}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return null;
  return withHash.toLowerCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function patternOverlayAuto(theme: 'dark' | 'light', patternIdx: number): string | undefined {
  if (patternIdx === 0) return undefined;
  const stripe =
    theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)';
  if (patternIdx === 1) {
    return `repeating-linear-gradient(-45deg, transparent, transparent 4px, ${stripe} 4px, ${stripe} 8px)`;
  }
  return `repeating-linear-gradient(90deg, transparent, transparent 3px, ${stripe} 3px, ${stripe} 6px), repeating-linear-gradient(0deg, transparent, transparent 3px, ${stripe} 3px, ${stripe} 6px)`;
}

function patternFromPreferencia(
  patron: PatronCalendario,
  patronColor: string,
): string | undefined {
  if (patron === 'LISO') return undefined;
  const stripe = hexToRgba(patronColor, 0.42);
  if (patron === 'RAYADO') {
    return `repeating-linear-gradient(-45deg, transparent, transparent 4px, ${stripe} 4px, ${stripe} 8px)`;
  }
  return `repeating-linear-gradient(90deg, transparent, transparent 3px, ${stripe} 3px, ${stripe} 6px), repeating-linear-gradient(0deg, transparent, transparent 3px, ${stripe} 3px, ${stripe} 6px)`;
}

export function styleFromPreferencia(pref: PersonaColorPreferencia): PersonaColorStyle {
  const patron = pref.patron ?? 'LISO';
  const bgImage =
    patron === 'LISO' || !pref.patronColor
      ? undefined
      : patternFromPreferencia(patron, pref.patronColor);
  return {
    bg: pref.fondo!,
    text: pref.texto!,
    border: pref.borde!,
    ...(bgImage ? { backgroundImage: bgImage } : {}),
  };
}

export function colorSlotForPersona(
  personaId: number,
  personaIdsOrdenados?: number[],
): number {
  if (personaIdsOrdenados?.length) {
    const idx = personaIdsOrdenados.indexOf(personaId);
    if (idx >= 0) return idx;
  }
  return personaId % (MAX_PERSONAS_COLOR * PATTERN_COUNT);
}

export function colorForPersona(
  personaId: number,
  theme: 'dark' | 'light' = 'dark',
  vistaSlot?: number,
  preferencia?: PersonaColorPreferencia | null,
): PersonaColorStyle {
  if (preferencia?.personalizado && preferencia.fondo && preferencia.texto && preferencia.borde) {
    return styleFromPreferencia(preferencia);
  }

  const palette = theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK;
  const resolvedSlot =
    vistaSlot !== undefined && vistaSlot >= 0
      ? vistaSlot
      : colorSlotForPersona(personaId);
  const colorIdx = resolvedSlot % palette.length;
  const patternIdx = Math.floor(resolvedSlot / palette.length) % PATTERN_COUNT;
  const base = palette[colorIdx]!;
  const backgroundImage = patternOverlayAuto(theme, patternIdx);
  return backgroundImage ? { ...base, backgroundImage } : base;
}

/** Mezcla un color hex hacia blanco (ratio 0 = original, 1 = blanco). */
export function mixWithWhite(hex: string, whiteRatio: number): string {
  const [r, g, b] = parseHex(hex);
  const w = Math.min(1, Math.max(0, whiteRatio));
  return rgbToHex(r * (1 - w) + 255 * w, g * (1 - w) + 255 * w, b * (1 - w) + 255 * w);
}

export function bubbleStyleForPersona(
  personaId: number,
  theme: 'dark' | 'light' = 'dark',
  vistaSlot?: number,
  preferencia?: PersonaColorPreferencia | null,
): Record<string, string> {
  const col = colorForPersona(personaId, theme, vistaSlot, preferencia);
  const style: Record<string, string> = {};
  if (theme === 'light') {
    style.borderColor = preferencia?.personalizado ? col.border : mixWithWhite(col.bg, 0.42);
    style.backgroundColor = preferencia?.personalizado ? col.bg : mixWithWhite(col.bg, 0.74);
    style.color = col.text;
  } else {
    style.borderColor = preferencia?.personalizado ? col.border : mixWithWhite(col.bg, 0.28);
    style.backgroundColor = preferencia?.personalizado ? col.bg : mixWithWhite(col.bg, 0.55);
    style.color = col.text;
  }
  if (col.backgroundImage) {
    style.backgroundImage = `${col.backgroundImage}, linear-gradient(${style.backgroundColor}, ${style.backgroundColor})`;
  }
  return style;
}

export function chipStyleForPersona(
  personaId: number,
  theme: 'dark' | 'light' = 'dark',
  vistaSlot?: number,
  preferencia?: PersonaColorPreferencia | null,
): Record<string, string> {
  const c = colorForPersona(personaId, theme, vistaSlot, preferencia);
  const style: Record<string, string> = {
    backgroundColor: c.bg,
    color: c.text,
    borderColor: c.border,
  };
  if (c.backgroundImage) {
    style.backgroundImage = c.backgroundImage;
  }
  return style;
}

export function chipStyleFromPreferencia(
  pref: PersonaColorPreferencia,
): Record<string, string> {
  const c = styleFromPreferencia(pref);
  const style: Record<string, string> = {
    backgroundColor: c.bg,
    color: c.text,
    borderColor: c.border,
  };
  if (c.backgroundImage) {
    style.backgroundImage = c.backgroundImage;
  }
  return style;
}
