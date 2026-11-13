/**
 * Genera planilla de referencia mínima en docs/reference/
 * Ejecutar: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/generate-reference-xlsx.ts
 */
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { RRHH_HEADERS } from '../src/exportaciones/rrhh-export.layout';

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Datos');
  sheet.addRow([...RRHH_HEADERS]);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(['16/4/2026', 9523, 'REMAGGI ELIAN', 'PROGRAMADOR', 'DTO DESARROLLO', 'Home Office']);
  sheet.addRow(['8/5/2026', 9147, 'TORRES AGUSTIN', 'PROGRAMADOR', 'DTO DESARROLLO', 'Home Office']);

  const out = path.resolve(
    __dirname,
    '../../../docs/reference/planilla-rrhh-reference.xlsx',
  );
  await workbook.xlsx.writeFile(out);
  console.log('Escrito:', out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
