import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const LEGAJO = 30010;
const LEGAJOS_CUPO = [30011, 30012, 30013] as const;

describe('Eventos API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let personaId: number;
  let tipoHoId: number;
  let personasCupoIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const funcion = await prisma.funcion.findFirstOrThrow();
    const servicio = await prisma.servicio.findFirstOrThrow();
    const persona = await prisma.persona.upsert({
      where: { legajo: LEGAJO },
      update: {},
      create: {
        legajo: LEGAJO,
        nombre: 'Eventos E2E',
        funcionId: funcion.id,
        servicioId: servicio.id,
      },
    });
    personaId = persona.id;
    tipoHoId = (
      await prisma.tipoEvento.findUniqueOrThrow({
        where: { codigo: 'HOME_OFFICE' },
      })
    ).id;

    for (const legajo of LEGAJOS_CUPO) {
      const p = await prisma.persona.upsert({
        where: { legajo },
        update: {},
        create: {
          legajo,
          nombre: `Cupo ${legajo}`,
          funcionId: funcion.id,
          servicioId: servicio.id,
        },
      });
      personasCupoIds.push(p.id);
    }
  });

  afterAll(async () => {
    await prisma.evento.deleteMany({
      where: { personaId: { in: [personaId, ...personasCupoIds] } },
    });
    await prisma.persona.deleteMany({
      where: { legajo: { in: [LEGAJO, ...LEGAJOS_CUPO] } },
    });
    await app.close();
  });

  beforeEach(async () => {
    await prisma.evento.deleteMany({
      where: { personaId: { in: [personaId, ...personasCupoIds] } },
    });
  });

  it('POST /eventos/validar y crear HO día hábil', async () => {
    const validar = await request(app.getHttpServer())
      .post('/eventos/validar')
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        personaId,
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-06-03',
        fechaHasta: '2026-06-03',
      })
      .expect(201);

    expect(validar.body.permitido).toBe(true);

    const crear = await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-06-03',
        fechaHasta: '2026-06-03',
      })
      .expect(201);

    expect(crear.body.estado).toBe('ACTIVO');
  });

  it('GET /eventos?month= filtra por mes', async () => {
    await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-06-03',
        fechaHasta: '2026-06-03',
      });

    const res = await request(app.getHttpServer())
      .get('/eventos?month=2026-06')
      .set('X-Shift-Legajo', String(LEGAJO))
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /eventos excluye cancelados por defecto', async () => {
    const created = await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-06-05',
        fechaHasta: '2026-06-05',
      });

    await request(app.getHttpServer())
      .post(`/eventos/${created.body.id}/cancelar`)
      .set('X-Shift-Legajo', String(LEGAJO));

    const sinCancelados = await request(app.getHttpServer())
      .get('/eventos?month=2026-06')
      .set('X-Shift-Legajo', String(LEGAJO))
      .expect(200);

    expect(
      sinCancelados.body.find((e: { id: number }) => e.id === created.body.id),
    ).toBeUndefined();

    const conCancelados = await request(app.getHttpServer())
      .get('/eventos?month=2026-06&incluirCancelados=true')
      .set('X-Shift-Legajo', String(LEGAJO))
      .expect(200);

    expect(
      conCancelados.body.find((e: { id: number }) => e.id === created.body.id),
    ).toMatchObject({ estado: 'CANCELADO' });
  });

  it('PATCH /eventos admite confirmarExcesoCupo', async () => {
    const diaLleno = '2026-06-10';
    const diaLibre = '2026-06-03';

    for (const pid of personasCupoIds) {
      await prisma.evento.create({
        data: {
          personaId: pid,
          tipoEventoId: tipoHoId,
          fechaDesde: new Date(`${diaLleno}T12:00:00.000Z`),
          fechaHasta: new Date(`${diaLleno}T12:00:00.000Z`),
        },
      });
    }

    const created = await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: diaLibre,
        fechaHasta: diaLibre,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/eventos/${created.body.id}`)
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        fechaDesde: diaLleno,
        fechaHasta: diaLleno,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.codigo).toBe('EXCESO_CUPO');
      });

    const updated = await request(app.getHttpServer())
      .patch(`/eventos/${created.body.id}`)
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        fechaDesde: diaLleno,
        fechaHasta: diaLleno,
        confirmarExcesoCupo: true,
      })
      .expect(200);

    expect(updated.body.excesoCupo).toBe(true);
    expect(updated.body.fechaDesde.slice(0, 10)).toBe(diaLleno);
  });

  it('POST /eventos/:id/cancelar', async () => {
    const created = await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-06-04',
        fechaHasta: '2026-06-04',
      });

    await request(app.getHttpServer())
      .post(`/eventos/${created.body.id}/cancelar`)
      .set('X-Shift-Legajo', String(LEGAJO))
      .expect(201)
      .expect((res) => {
        expect(res.body.estado).toBe('CANCELADO');
      });
  });
});
