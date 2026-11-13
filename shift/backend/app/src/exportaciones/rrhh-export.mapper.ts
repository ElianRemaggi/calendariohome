import { EstadoEvento } from '@prisma/client';
import {
  cadaDiaEnRango,
  fechaEnRangoInclusive,
} from '../eventos/utils/fechas.util';

export interface RrhhExportRow {
  fecha: Date;
  legajo: number;
  nombre: string;
  funcion: string;
  servicio: string;
  motivo: string;
}

export type EventoParaExport = {
  fechaDesde: Date;
  fechaHasta: Date;
  estado: EstadoEvento;
  persona: {
    legajo: number;
    nombre: string;
    funcion: { nombre: string };
    servicio: { nombre: string };
  };
  tipoEvento: { nombre: string };
};

export function mapEventosToRrhhRows(
  eventos: EventoParaExport[],
  desdeLimite: Date,
  hastaLimite: Date,
): RrhhExportRow[] {
  const rows: RrhhExportRow[] = [];

  for (const ev of eventos) {
    if (ev.estado !== EstadoEvento.ACTIVO) {
      continue;
    }

    const dias = cadaDiaEnRango(ev.fechaDesde, ev.fechaHasta);
    for (const dia of dias) {
      // Comparar por día calendario: @db.Date llega a medianoche y el rango
      // de liquidación/mes usa mediodía; `<`/`>` por timestamp excluye el día 16.
      if (!fechaEnRangoInclusive(dia, desdeLimite, hastaLimite)) {
        continue;
      }
      rows.push({
        fecha: dia,
        legajo: ev.persona.legajo,
        nombre: ev.persona.nombre.trim().toUpperCase(),
        funcion: ev.persona.funcion?.nombre ?? '',
        servicio: ev.persona.servicio.nombre,
        motivo: ev.tipoEvento.nombre,
      });
    }
  }

  rows.sort((a, b) => {
    const byDate = a.fecha.getTime() - b.fecha.getTime();
    if (byDate !== 0) {
      return byDate;
    }
    return a.legajo - b.legajo;
  });

  return rows;
}
