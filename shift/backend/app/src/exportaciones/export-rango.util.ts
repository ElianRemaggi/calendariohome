import { BadRequestException } from '@nestjs/common';
import { inicioYFinMes, parseFechaLocal } from '../eventos/utils/fechas.util';

export type ExportModo = 'mes' | 'liquidacion' | 'rango';

export interface ExportRangoResuelto {
  desde: Date;
  hasta: Date;
  /** Etiqueta corta para nombre de archivo */
  etiqueta: string;
}

/** Período de liquidación: 16 del mes anterior al 15 del mes indicado (YYYY-MM = mes del día 15). */
export function inicioYFinLiquidacion(month: string): { desde: Date; hasta: Date } {
  const [y, m] = month.split('-').map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  return {
    desde: new Date(Date.UTC(prevY, prevM - 1, 16, 12)),
    hasta: new Date(Date.UTC(y, m - 1, 15, 12)),
  };
}

export function resolverRangoExport(params: {
  modo: ExportModo;
  month?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): ExportRangoResuelto {
  switch (params.modo) {
    case 'mes': {
      if (!params.month) {
        throw new BadRequestException('month es obligatorio para modo mes');
      }
      const { desde, hasta } = inicioYFinMes(params.month);
      return { desde, hasta, etiqueta: params.month };
    }
    case 'liquidacion': {
      if (!params.month) {
        throw new BadRequestException(
          'month es obligatorio para modo liquidacion (mes del día 15 de cierre)',
        );
      }
      const { desde, hasta } = inicioYFinLiquidacion(params.month);
      const d = formatDiaArchivo(desde);
      const h = formatDiaArchivo(hasta);
      return { desde, hasta, etiqueta: `liq-${params.month}-${d}_${h}` };
    }
    case 'rango': {
      if (!params.fechaDesde || !params.fechaHasta) {
        throw new BadRequestException(
          'fechaDesde y fechaHasta son obligatorios para modo rango',
        );
      }
      const desde = parseFechaLocal(params.fechaDesde);
      const hasta = parseFechaLocal(params.fechaHasta);
      if (desde > hasta) {
        throw new BadRequestException(
          'fechaDesde no puede ser posterior a fechaHasta',
        );
      }
      return {
        desde,
        hasta,
        etiqueta: `${formatDiaArchivo(desde)}_${formatDiaArchivo(hasta)}`,
      };
    }
    default:
      throw new BadRequestException('modo de exportación inválido');
  }
}

function formatDiaArchivo(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}
