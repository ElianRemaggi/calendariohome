import { Test, TestingModule } from '@nestjs/testing';
import { EstadoEvento } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { EventosReglasService } from '../src/eventos/eventos-reglas.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  mesActualArgentina,
  parseFechaLocal,
  todayIsoArgentina,
} from '../src/eventos/utils/fechas.util';

function addMonthKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1, 12));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

describe('EventosReglasService', () => {
  let reglas: EventosReglasService;
  let prisma: PrismaService;
  let tipoHoId: number;
  let tipoVacId: number;
  let personas: number[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    reglas = module.get(EventosReglasService);
    prisma = module.get(PrismaService);

    const ho = await prisma.tipoEvento.findUniqueOrThrow({
      where: { codigo: 'HOME_OFFICE' },
    });
    const vac = await prisma.tipoEvento.findUniqueOrThrow({
      where: { codigo: 'VACACIONES' },
    });
    tipoHoId = ho.id;
    tipoVacId = vac.id;

    await prisma.tipoEvento.update({
      where: { id: tipoHoId },
      data: { mesMinOffsetUser: 0, mesMaxOffsetUser: 1 },
    });
    await prisma.tipoEvento.update({
      where: { id: tipoVacId },
      data: {
        mesMinOffsetUser: 0,
        mesMaxOffsetUser: null,
        minDiasRango: 7,
        maxDiasRango: 35,
      },
    });

    const funcion = await prisma.funcion.findFirstOrThrow();
    const servicio = await prisma.servicio.findFirstOrThrow();

    for (let legajo = 30001; legajo <= 30008; legajo++) {
      const p = await prisma.persona.upsert({
        where: { legajo },
        update: { activo: true },
        create: {
          legajo,
          nombre: `Test ${legajo}`,
          funcionId: funcion.id,
          servicioId: servicio.id,
        },
      });
      personas.push(p.id);
    }
  });

  afterAll(async () => {
    await prisma.evento.deleteMany({
      where: { personaId: { in: personas } },
    });
    await prisma.persona.deleteMany({
      where: { legajo: { gte: 30001, lte: 30008 } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.evento.deleteMany({
      where: { personaId: { in: personas } },
    });
  });

  describe('fin de semana', () => {
    it('rechaza sábado para Home Office', async () => {
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: parseFechaLocal('2026-06-06'),
        fechaHasta: parseFechaLocal('2026-06-06'),
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'FIN_DE_SEMANA')).toBe(true);
    });

    it('permite rango de vacaciones con fines de semana si bloqueaFinDeSemana es false', async () => {
      await prisma.tipoEvento.update({
        where: { id: tipoVacId },
        data: { bloqueaFinDeSemana: false, bloqueaFeriado: false },
      });
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: parseFechaLocal('2026-06-04'),
        fechaHasta: parseFechaLocal('2026-06-18'),
      });
      expect(r.permitido).toBe(true);
      expect(r.errores.some((e) => e.codigo === 'FIN_DE_SEMANA')).toBe(false);
    });
  });

  describe('feriado', () => {
    it('rechaza día feriado activo', async () => {
      await prisma.feriado.upsert({
        where: { fecha: parseFechaLocal('2026-06-10') },
        update: { activo: true, descripcion: 'Test feriado' },
        create: {
          fecha: parseFechaLocal('2026-06-10'),
          descripcion: 'Test feriado',
        },
      });
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: parseFechaLocal('2026-06-10'),
        fechaHasta: parseFechaLocal('2026-06-10'),
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'FERIADO')).toBe(true);
    });

    it('permite vacaciones en feriado si bloqueaFeriado es false', async () => {
      await prisma.tipoEvento.update({
        where: { id: tipoVacId },
        data: { bloqueaFinDeSemana: false, bloqueaFeriado: false },
      });
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: parseFechaLocal('2026-06-10'),
        fechaHasta: parseFechaLocal('2026-06-10'),
      });
      expect(r.permitido).toBe(true);
      expect(r.errores.some((e) => e.codigo === 'FERIADO')).toBe(false);
    });
  });

  describe('un evento por dia', () => {
    it('rechaza segundo evento mismo día otra persona', async () => {
      await prisma.evento.create({
        data: {
          personaId: personas[0],
          tipoEventoId: tipoHoId,
          fechaDesde: parseFechaLocal('2026-06-03'),
          fechaHasta: parseFechaLocal('2026-06-03'),
        },
      });
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: parseFechaLocal('2026-06-03'),
        fechaHasta: parseFechaLocal('2026-06-03'),
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'UN_EVENTO_POR_DIA')).toBe(true);
    });
  });

  describe('exceso cupo', () => {
    it('4to HO advierte; con confirmar permite excesoCupo', async () => {
      const dia = parseFechaLocal('2026-06-04');
      for (let i = 0; i < 3; i++) {
        await prisma.evento.create({
          data: {
            personaId: personas[i],
            tipoEventoId: tipoHoId,
            fechaDesde: dia,
            fechaHasta: dia,
          },
        });
      }
      const sinConfirmar = await reglas.validar({
        personaId: personas[3],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
      });
      expect(sinConfirmar.permitido).toBe(true);
      expect(sinConfirmar.advertencias.some((a) => a.codigo === 'EXCESO_CUPO')).toBe(
        true,
      );

      const conConfirmar = await reglas.validar({
        personaId: personas[3],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        confirmarExcesoCupo: true,
      });
      expect(conConfirmar.excesoCupo).toBe(true);
    });
  });

  describe('rango días por tipo', () => {
    it('rechaza menos de 7 días corridos (Vacaciones)', async () => {
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: parseFechaLocal('2026-07-01'),
        fechaHasta: parseFechaLocal('2026-07-05'),
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'RANGO_MIN_DIAS')).toBe(true);
    });

    it('rechaza más de 35 días corridos', async () => {
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: parseFechaLocal('2026-07-01'),
        fechaHasta: parseFechaLocal('2026-08-05'),
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'RANGO_MAX_DIAS')).toBe(true);
    });

    it('permite entre 7 y 35 días corridos', async () => {
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: parseFechaLocal('2026-07-01'),
        fechaHasta: parseFechaLocal('2026-07-07'),
      });
      expect(r.permitido).toBe(true);
      expect(r.errores.some((e) => e.codigo === 'RANGO_MIN_DIAS')).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'RANGO_MAX_DIAS')).toBe(false);
    });

    it('bloquea otro evento en día dentro del rango', async () => {
      await prisma.evento.create({
        data: {
          personaId: personas[0],
          tipoEventoId: tipoVacId,
          fechaDesde: parseFechaLocal('2026-06-01'),
          fechaHasta: parseFechaLocal('2026-06-05'),
        },
      });
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: parseFechaLocal('2026-06-03'),
        fechaHasta: parseFechaLocal('2026-06-03'),
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'UN_EVENTO_POR_DIA')).toBe(true);
    });
  });

  describe('vacaciones cupo', () => {
    it('4ta vacación mismo día rechazada sin exceso', async () => {
      const dia = parseFechaLocal('2026-06-08');
      for (let i = 0; i < 3; i++) {
        await prisma.evento.create({
          data: {
            personaId: personas[i],
            tipoEventoId: tipoVacId,
            fechaDesde: dia,
            fechaHasta: dia,
          },
        });
      }
      const r = await reglas.validar({
        personaId: personas[3],
        tipoEventoId: tipoVacId,
        fechaDesde: dia,
        fechaHasta: dia,
      });
      expect(r.permitido).toBe(false);
      expect(r.errores.some((e) => e.codigo === 'CUPO_LLENO')).toBe(true);
    });
  });

  describe('ventana temporal', () => {
    it('USER: rechaza mes anterior (HO)', async () => {
      const ref = mesActualArgentina();
      const prev = addMonthKey(ref, -1);
      const dia = parseFechaLocal(`${prev}-15`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: false,
      });
      expect(r.permitido).toBe(false);
      expect(
        r.errores.some((e) => e.codigo === 'MES_ANTERIOR_NO_PERMITIDO'),
      ).toBe(true);
    });

    it('USER: permite mes siguiente (HO)', async () => {
      const ref = mesActualArgentina();
      const next = addMonthKey(ref, 1);
      const dia = parseFechaLocal(`${next}-10`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: false,
      });
      expect(r.errores.some((e) => e.codigo === 'MES_POSTERIOR_NO_PERMITIDO')).toBe(
        false,
      );
    });

    it('USER: rechaza dos meses adelante (HO)', async () => {
      const ref = mesActualArgentina();
      const far = addMonthKey(ref, 2);
      const dia = parseFechaLocal(`${far}-10`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: false,
      });
      expect(
        r.errores.some((e) => e.codigo === 'MES_POSTERIOR_NO_PERMITIDO'),
      ).toBe(true);
    });

    it('ADMIN (exento): sin restricción al validar por otra persona', async () => {
      const ref = mesActualArgentina();
      const far = addMonthKey(ref, 3);
      const dia = parseFechaLocal(`${far}-10`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: true,
      });
      expect(
        r.errores.some((e) => e.codigo === 'MES_POSTERIOR_NO_PERMITIDO'),
      ).toBe(false);
    });

    it('ADMIN propio: sin restricción de ventana (permite +2 meses)', async () => {
      const ref = mesActualArgentina();
      const far = addMonthKey(ref, 2);
      const dia = parseFechaLocal(`${far}-10`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: true,
      });
      expect(
        r.errores.some((e) => e.codigo === 'MES_POSTERIOR_NO_PERMITIDO'),
      ).toBe(false);
    });

    it('ADMIN propio: permite mes anterior', async () => {
      const ref = mesActualArgentina();
      const prev = addMonthKey(ref, -1);
      const dia = parseFechaLocal(`${prev}-15`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: true,
      });
      expect(
        r.errores.some((e) => e.codigo === 'MES_ANTERIOR_NO_PERMITIDO'),
      ).toBe(false);
    });

    it('USER: rechaza el día de hoy (anticipación mínima)', async () => {
      const dia = parseFechaLocal(todayIsoArgentina());
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: false,
      });
      expect(r.permitido).toBe(false);
      expect(
        r.errores.some((e) => e.codigo === 'ANTICIPACION_MINIMA'),
      ).toBe(true);
    });

    it('ADMIN: permite el día de hoy (sin error de anticipación)', async () => {
      const dia = parseFechaLocal(todayIsoArgentina());
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: true,
      });
      expect(
        r.errores.some((e) => e.codigo === 'ANTICIPACION_MINIMA'),
      ).toBe(false);
    });

    it('VACACIONES: futuro lejano permitido', async () => {
      const ref = mesActualArgentina();
      const far = addMonthKey(ref, 6);
      const dia = parseFechaLocal(`${far}-01`);
      const r = await reglas.validar({
        personaId: personas[0],
        tipoEventoId: tipoVacId,
        fechaDesde: dia,
        fechaHasta: dia,
        actorEsAdmin: false,
      });
      expect(
        r.errores.some((e) => e.codigo === 'MES_POSTERIOR_NO_PERMITIDO'),
      ).toBe(false);
    });
  });

  describe('cancelado cupo', () => {
    it('cancelado no cuenta para cupo', async () => {
      const dia = parseFechaLocal('2026-06-09');
      for (let i = 0; i < 3; i++) {
        await prisma.evento.create({
          data: {
            personaId: personas[i],
            tipoEventoId: tipoHoId,
            fechaDesde: dia,
            fechaHasta: dia,
          },
        });
      }
      await prisma.evento.updateMany({
        where: { personaId: personas[2], fechaDesde: dia },
        data: {
          estado: EstadoEvento.CANCELADO,
          canceladoEn: new Date(),
        },
      });

      const r = await reglas.validar({
        personaId: personas[3],
        tipoEventoId: tipoHoId,
        fechaDesde: dia,
        fechaHasta: dia,
      });
      expect(r.permitido).toBe(true);
      expect(r.advertencias.length).toBe(0);
      expect(r.excesoCupo).toBe(false);
    });
  });
});
