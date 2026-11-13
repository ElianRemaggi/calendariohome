import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const LEGAJO_A = 30101;
const LEGAJO_B = 30102;

describe('Eventos calendario equipo (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tipoHoId: number;
  let personaAId: number;
  let personaBId: number;

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
    tipoHoId = (
      await prisma.tipoEvento.findUniqueOrThrow({
        where: { codigo: 'HOME_OFFICE' },
      })
    ).id;

    const a = await prisma.persona.upsert({
      where: { legajo: LEGAJO_A },
      update: {},
      create: {
        legajo: LEGAJO_A,
        nombre: 'Equipo A',
        funcionId: funcion.id,
        servicioId: servicio.id,
      },
    });
    const b = await prisma.persona.upsert({
      where: { legajo: LEGAJO_B },
      update: {},
      create: {
        legajo: LEGAJO_B,
        nombre: 'Equipo B',
        funcionId: funcion.id,
        servicioId: servicio.id,
      },
    });
    personaAId = a.id;
    personaBId = b.id;
  });

  afterAll(async () => {
    await prisma.evento.deleteMany({
      where: { personaId: { in: [personaAId, personaBId] } },
    });
    await prisma.persona.deleteMany({
      where: { legajo: { in: [LEGAJO_A, LEGAJO_B] } },
    });
    await app.close();
  });

  beforeEach(async () => {
    await prisma.evento.deleteMany({
      where: { personaId: { in: [personaAId, personaBId] } },
    });
  });

  it('GET con tipoEventoId devuelve eventos de todo el equipo', async () => {
    await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-07-07',
        fechaHasta: '2026-07-07',
      });

    await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-07-08',
        fechaHasta: '2026-07-08',
      });

    const res = await request(app.getHttpServer())
      .get(`/eventos?month=2026-07&tipoEventoId=${tipoHoId}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const legajos = res.body.map((e: { persona: { legajo: number } }) => e.persona.legajo);
    expect(legajos).toContain(LEGAJO_A);
    expect(legajos).toContain(LEGAJO_B);
  });

  it('GET sin tipoEventoId solo devuelve eventos propios', async () => {
    await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-07-10',
        fechaHasta: '2026-07-10',
      });

    await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-07-11',
        fechaHasta: '2026-07-11',
      });

    const res = await request(app.getHttpServer())
      .get('/eventos?month=2026-07')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(200);

    expect(res.body.every((e: { personaId: number }) => e.personaId === personaAId)).toBe(
      true,
    );
  });

  it('USER no puede editar ni cancelar eventos de un compañero', async () => {
    const created = await request(app.getHttpServer())
      .post('/eventos')
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({
        tipoEventoId: tipoHoId,
        fechaDesde: '2026-07-15',
        fechaHasta: '2026-07-15',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/eventos/${created.body.id}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({ observacion: 'intento' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/eventos/${created.body.id}/cancelar`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(403);
  });
});
