import type { TipoEvento } from '~/types';
import { eachDayInRange } from '~/utils/fechas';

export function diasCorridosEnRango(desde: string, hasta: string): number {
  if (!desde || !hasta || desde > hasta) return 0;
  return eachDayInRange(desde, hasta).length;
}

/** Validación cliente alineada con backend (R5.1). */
export function errorDiasRangoTipo(
  tipo: Pick<TipoEvento, 'permiteCargaPorRango' | 'minDiasRango' | 'maxDiasRango' | 'nombre'> | undefined,
  desde: string,
  hasta: string,
): string | null {
  if (!tipo?.permiteCargaPorRango) return null;
  const n = diasCorridosEnRango(desde, hasta);
  const nombre = tipo.nombre ?? 'Este tipo';
  if (tipo.minDiasRango != null && n < tipo.minDiasRango) {
    return `${nombre} requiere al menos ${tipo.minDiasRango} días corridos (el rango tiene ${n} días)`;
  }
  if (tipo.maxDiasRango != null && n > tipo.maxDiasRango) {
    return `${nombre} no puede superar ${tipo.maxDiasRango} días corridos (el rango tiene ${n} días)`;
  }
  return null;
}

export function hintDiasRangoTipo(
  tipo: Pick<TipoEvento, 'permiteCargaPorRango' | 'minDiasRango' | 'maxDiasRango'> | undefined,
): string | null {
  if (!tipo?.permiteCargaPorRango) return null;
  const min = tipo.minDiasRango;
  const max = tipo.maxDiasRango;
  if (min != null && max != null) {
    return `Entre ${min} y ${max} días corridos por pedido.`;
  }
  if (min != null) {
    return `Mínimo ${min} días corridos por pedido.`;
  }
  if (max != null) {
    return `Máximo ${max} días corridos por pedido.`;
  }
  return null;
}
