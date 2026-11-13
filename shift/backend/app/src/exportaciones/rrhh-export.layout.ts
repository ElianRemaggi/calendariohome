import * as ExcelJS from 'exceljs';
import { formatFechaEsAr } from '../eventos/utils/fechas.util';
import type { RrhhExportRow } from './rrhh-export.mapper';

export const RRHH_HEADERS = [
  'FECHA',
  'LEGAJO',
  'APELLIDO Y NOMBRE',
  'FUNCION',
  'SERVICIO',
  'MOTIVO',
] as const;

export const RRHH_COLUMN_WIDTHS = [14, 10, 36, 18, 22, 16];

/** Formato D/M/YYYY (Argentina), ej. 16/4/2026 */
export function formatFechaRrhh(date: Date): string {
  return formatFechaEsAr(date);
}

export function rowToExcelValues(row: RrhhExportRow): (string | number)[] {
  return [
    formatFechaRrhh(row.fecha),
    row.legajo,
    row.nombre,
    row.funcion,
    row.servicio,
    row.motivo,
  ];
}

export async function buildRrhhXlsxBuffer(rows: RrhhExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Datos');

  sheet.columns = RRHH_HEADERS.map((header, i) => ({
    header,
    key: header,
    width: RRHH_COLUMN_WIDTHS[i],
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      FECHA: formatFechaRrhh(row.fecha),
      LEGAJO: row.legajo,
      'APELLIDO Y NOMBRE': row.nombre,
      FUNCION: row.funcion,
      SERVICIO: row.servicio,
      MOTIVO: row.motivo,
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
