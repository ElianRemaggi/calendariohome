import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoEvento } from '@prisma/client';
import { inicioDiaUtc } from '../eventos/utils/fechas.util';
import { PrismaService } from '../prisma/prisma.service';
import { buildRrhhXlsxBuffer } from './rrhh-export.layout';
import { mapEventosToRrhhRows } from './rrhh-export.mapper';
import { ExportRangoResuelto } from './export-rango.util';

const eventoInclude = {
  tipoEvento: true,
  persona: {
    include: { funcion: true, servicio: true },
  },
} as const;

@Injectable()
export class RrhhExportService {
  constructor(private readonly prisma: PrismaService) {}

  async buildRrhhWorkbook(
    rango: ExportRangoResuelto,
    tipoEventoId: number,
    servicioId?: number,
  ): Promise<Buffer> {
    const tipo = await this.prisma.tipoEvento.findUnique({
      where: { id: tipoEventoId },
    });
    if (!tipo) {
      throw new NotFoundException('Tipo de evento no encontrado');
    }

    // @db.Date se lee como medianoche UTC; normalizar límites al inicio del día
    // para que el 16 (inicio) y el 15 (fin) entren inclusive en la query.
    const desde = inicioDiaUtc(rango.desde);
    const hasta = inicioDiaUtc(rango.hasta);

    const eventos = await this.prisma.evento.findMany({
      where: {
        estado: EstadoEvento.ACTIVO,
        tipoEventoId,
        ...(servicioId !== undefined && {
          persona: { servicioId },
        }),
        fechaDesde: { lte: hasta },
        fechaHasta: { gte: desde },
      },
      include: eventoInclude,
      orderBy: [{ fechaDesde: 'asc' }, { personaId: 'asc' }],
    });

    const rows = mapEventosToRrhhRows(eventos, desde, hasta);
    return buildRrhhXlsxBuffer(rows);
  }
}
