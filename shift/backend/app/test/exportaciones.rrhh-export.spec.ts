import { EstadoEvento } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import {
  RRHH_HEADERS,
  buildRrhhXlsxBuffer,
  formatFechaRrhh,
} from '../src/exportaciones/rrhh-export.layout';
import {
  inicioYFinLiquidacion,
  resolverRangoExport,
} from '../src/exportaciones/export-rango.util';
import {
  EventoParaExport,
  mapEventosToRrhhRows,
} from '../src/exportaciones/rrhh-export.mapper';
import { inicioYFinMes } from '../src/eventos/utils/fechas.util';

describe('export rango', () => {
  it('mes completo', () => {
    const r = resolverRangoExport({ modo: 'mes', month: '2026-05' });
    expect(r.desde.toISOString().slice(0, 10)).toBe('2026-05-01');
    expect(r.hasta.toISOString().slice(0, 10)).toBe('2026-05-31');
  });

  it('liquidación: 16 mes anterior al 15 del mes', () => {
    const { desde, hasta } = inicioYFinLiquidacion('2026-05');
    expect(desde.toISOString().slice(0, 10)).toBe('2026-04-16');
    expect(hasta.toISOString().slice(0, 10)).toBe('2026-05-15');
    const r = resolverRangoExport({ modo: 'liquidacion', month: '2026-05' });
    expect(r.desde.getTime()).toBe(desde.getTime());
    expect(r.hasta.getTime()).toBe(hasta.getTime());
  });

  it('liquidación incluye día 16 y día 15 con fechas @db.Date (medianoche UTC)', () => {
    const { desde, hasta } = inicioYFinLiquidacion('2026-05');
    // Prisma @db.Date → T00:00:00.000Z; el rango de liquidación usa T12:00:00.000Z
    const rows = mapEventosToRrhhRows(
      [
        {
          fechaDesde: new Date('2026-04-16T00:00:00.000Z'),
          fechaHasta: new Date('2026-04-16T00:00:00.000Z'),
          estado: EstadoEvento.ACTIVO,
          persona: {
            legajo: 111,
            nombre: 'Dia Dieciseis',
            funcion: { nombre: 'PROGRAMADOR' },
            servicio: { nombre: 'DTO DESARROLLO' },
          },
          tipoEvento: { nombre: 'Home Office' },
        },
        {
          fechaDesde: new Date('2026-05-15T00:00:00.000Z'),
          fechaHasta: new Date('2026-05-15T00:00:00.000Z'),
          estado: EstadoEvento.ACTIVO,
          persona: {
            legajo: 222,
            nombre: 'Dia Quince',
            funcion: { nombre: 'PROGRAMADOR' },
            servicio: { nombre: 'DTO DESARROLLO' },
          },
          tipoEvento: { nombre: 'Home Office' },
        },
        {
          fechaDesde: new Date('2026-04-15T00:00:00.000Z'),
          fechaHasta: new Date('2026-04-15T00:00:00.000Z'),
          estado: EstadoEvento.ACTIVO,
          persona: {
            legajo: 333,
            nombre: 'Fuera De Rango',
            funcion: { nombre: 'PROGRAMADOR' },
            servicio: { nombre: 'DTO DESARROLLO' },
          },
          tipoEvento: { nombre: 'Home Office' },
        },
      ],
      desde,
      hasta,
    );
    expect(rows.map((r) => r.legajo).sort()).toEqual([111, 222]);
    expect(formatFechaRrhh(rows.find((r) => r.legajo === 111)!.fecha)).toBe(
      '16/4/2026',
    );
    expect(formatFechaRrhh(rows.find((r) => r.legajo === 222)!.fecha)).toBe(
      '15/5/2026',
    );
  });

  it('rango personalizado', () => {
    const r = resolverRangoExport({
      modo: 'rango',
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });
    expect(r.desde.toISOString().slice(0, 10)).toBe('2026-04-01');
    expect(r.hasta.toISOString().slice(0, 10)).toBe('2026-04-30');
  });
});

describe('export layout', () => {
  it('headers FECHA, LEGAJO, APELLIDO Y NOMBRE, FUNCION, SERVICIO, MOTIVO', () => {
    expect([...RRHH_HEADERS]).toEqual([
      'FECHA',
      'LEGAJO',
      'APELLIDO Y NOMBRE',
      'FUNCION',
      'SERVICIO',
      'MOTIVO',
    ]);
  });

  it('formato fecha D/M/YYYY', () => {
    const fecha = new Date('2026-05-08T12:00:00.000Z');
    expect(formatFechaRrhh(fecha)).toMatch(/^\d{1,2}\/\d{1,2}\/2026$/);
    expect(formatFechaRrhh(fecha)).toBe('8/5/2026');
  });

  it('formato fecha con Date de Prisma (@db.Date, medianoche UTC)', () => {
    const fecha = new Date('2026-05-08T00:00:00.000Z');
    expect(formatFechaRrhh(fecha)).toBe('8/5/2026');
  });

  it('MOTIVO = TipoEvento.nombre en xlsx generado', async () => {
    const { desde, hasta } = inicioYFinMes('2026-05');
    const rows = mapEventosToRrhhRows(
      [
        {
          fechaDesde: new Date('2026-05-08T12:00:00.000Z'),
          fechaHasta: new Date('2026-05-08T12:00:00.000Z'),
          estado: EstadoEvento.ACTIVO,
          persona: {
            legajo: 9147,
            nombre: 'Torres Agustin',
            funcion: { nombre: 'PROGRAMADOR' },
            servicio: { nombre: 'DTO DESARROLLO' },
          },
          tipoEvento: { nombre: 'Home Office' },
        },
      ],
      desde,
      hasta,
    );

    const buffer = await buildRrhhXlsxBuffer(rows);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.worksheets[0];
    expect(sheet.getRow(1).getCell(6).value).toBe('MOTIVO');
    expect(sheet.getRow(2).getCell(6).value).toBe('Home Office');
    expect(sheet.getRow(2).getCell(3).value).toBe('TORRES AGUSTIN');
  });

  it('fecha en xlsx correcta con eventos leídos de BD (medianoche UTC)', async () => {
    const { desde, hasta } = inicioYFinMes('2026-05');
    const rows = mapEventosToRrhhRows(
      [
        {
          fechaDesde: new Date('2026-05-08T00:00:00.000Z'),
          fechaHasta: new Date('2026-05-08T00:00:00.000Z'),
          estado: EstadoEvento.ACTIVO,
          persona: {
            legajo: 9147,
            nombre: 'Torres Agustin',
            funcion: { nombre: 'PROGRAMADOR' },
            servicio: { nombre: 'DTO DESARROLLO' },
          },
          tipoEvento: { nombre: 'Home Office' },
        },
      ],
      desde,
      hasta,
    );

    const buffer = await buildRrhhXlsxBuffer(rows);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    expect(workbook.worksheets[0].getRow(2).getCell(1).value).toBe('8/5/2026');
  });
});

describe('export excluye cancelados', () => {
  const baseEvento: EventoParaExport = {
    fechaDesde: new Date('2026-05-10T12:00:00.000Z'),
    fechaHasta: new Date('2026-05-10T12:00:00.000Z'),
    estado: EstadoEvento.ACTIVO,
    persona: {
      legajo: 100,
      nombre: 'Test User',
      funcion: { nombre: 'PROGRAMADOR' },
      servicio: { nombre: 'DTO DESARROLLO' },
    },
    tipoEvento: { nombre: 'Home Office' },
  };

  it('no incluye eventos CANCELADO', () => {
    const { desde, hasta } = inicioYFinMes('2026-05');
    const rows = mapEventosToRrhhRows(
      [
        baseEvento,
        { ...baseEvento, estado: EstadoEvento.CANCELADO, persona: { ...baseEvento.persona, legajo: 200 } },
      ],
      desde,
      hasta,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].legajo).toBe(100);
  });

  it('vacaciones generan una fila por día del mes', () => {
    const { desde, hasta } = inicioYFinMes('2026-05');
    const rows = mapEventosToRrhhRows(
      [
        {
          ...baseEvento,
          fechaDesde: new Date('2026-05-28T12:00:00.000Z'),
          fechaHasta: new Date('2026-06-02T12:00:00.000Z'),
          tipoEvento: { nombre: 'Vacaciones' },
        },
      ],
      desde,
      hasta,
    );
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.motivo === 'Vacaciones')).toBe(true);
  });
});
