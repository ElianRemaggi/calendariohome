import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_LEGAJO = 9147;
const TEST_LEGAJO = 10001;

describe('Catálogos y personas (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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
    await prisma.persona.deleteMany({ where: { legajo: TEST_LEGAJO } });
  });

  afterAll(async () => {
    await prisma.persona.deleteMany({ where: { legajo: TEST_LEGAJO } });
    await app.close();
  });

  it('GET /funciones sin header (público)', () => {
    return request(app.getHttpServer())
      .get('/funciones')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      });
  });

  it('GET /servicios y /tipos-evento', async () => {
    await request(app.getHttpServer())
      .get('/servicios')
      .set('X-Shift-Legajo', String(ADMIN_LEGAJO))
      .expect(200);
    await request(app.getHttpServer()).get('/tipos-evento').expect(200);
  });

  it('GET /personas/by-legajo/:legajo admin', () => {
    return request(app.getHttpServer())
      .get(`/personas/by-legajo/${ADMIN_LEGAJO}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.rol).toBe('SUPER_ADMIN');
        expect(res.body.adminServicioIds).toEqual([]);
        expect(res.body.legajo).toBe(ADMIN_LEGAJO);
      });
  });

  it('POST /personas crea usuario', () => {
    return request(app.getHttpServer())
      .post('/personas')
      .set('X-Shift-Legajo', String(ADMIN_LEGAJO))
      .send({
        legajo: TEST_LEGAJO,
        nombre: 'Test User E2E',
        funcionId: 1,
        servicioId: 1,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.legajo).toBe(TEST_LEGAJO);
        expect(res.body.rol).toBe('USER');
      });
  });

  it('POST /personas legajo duplicado → 409', () => {
    return request(app.getHttpServer())
      .post('/personas')
      .set('X-Shift-Legajo', String(ADMIN_LEGAJO))
      .send({
        legajo: TEST_LEGAJO,
        nombre: 'Dup',
        funcionId: 1,
        servicioId: 1,
      })
      .expect(409);
  });

  it('PATCH /personas rechaza cambio de legajo', async () => {
    const persona = await prisma.persona.findUniqueOrThrow({
      where: { legajo: TEST_LEGAJO },
    });
    await request(app.getHttpServer())
      .patch(`/personas/${persona.id}`)
      .set('X-Shift-Legajo', String(TEST_LEGAJO))
      .send({ legajo: 99999 })
      .expect(403);
  });

  it('POST /funciones requiere admin', async () => {
    await request(app.getHttpServer())
      .post('/funciones')
      .set('X-Shift-Legajo', String(ADMIN_LEGAJO))
      .send({ nombre: `TEST_FUNC_${Date.now()}` })
      .expect(201);
  });

  it('POST /funciones usuario común → 403', () => {
    return request(app.getHttpServer())
      .post('/funciones')
      .set('X-Shift-Legajo', String(TEST_LEGAJO))
      .send({ nombre: 'NO_ADMIN' })
      .expect(403);
  });

  it('POST /tipos-evento con mesMaxOffsetUser null (ventana ilimitada)', async () => {
    const codigo = `TEST_TIPO_${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/tipos-evento')
      .set('X-Shift-Legajo', String(ADMIN_LEGAJO))
      .send({
        nombre: 'Tipo prueba e2e',
        codigo,
        cupoDiario: 2,
        permiteExcesoCupo: false,
        permiteCargaPorRango: false,
        bloqueaFinDeSemana: true,
        bloqueaFeriado: true,
        mesMinOffsetUser: 0,
        mesMaxOffsetUser: null,
      })
      .expect(201);

    expect(res.body.codigo).toBe(codigo);
    expect(res.body.mesMaxOffsetUser).toBeNull();

    await prisma.tipoEvento.delete({ where: { id: res.body.id } });
  });
});
