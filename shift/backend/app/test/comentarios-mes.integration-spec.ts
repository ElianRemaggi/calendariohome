import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Rol } from '@prisma/client';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const LEGAJO_A = 30301;
const LEGAJO_B = 30302;
const LEGAJO_ADMIN = 30399;
const MONTH = '2026-08';

describe('ComentariosMes (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let servicioId: number;
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
    servicioId = (await prisma.servicio.findFirstOrThrow()).id;

    const a = await prisma.persona.upsert({
      where: { legajo: LEGAJO_A },
      update: {},
      create: {
        legajo: LEGAJO_A,
        nombre: 'Chat Autor',
        funcionId: funcion.id,
        servicioId,
      },
    });
    const b = await prisma.persona.upsert({
      where: { legajo: LEGAJO_B },
      update: {},
      create: {
        legajo: LEGAJO_B,
        nombre: 'Chat Otro',
        funcionId: funcion.id,
        servicioId,
      },
    });
    await prisma.persona.upsert({
      where: { legajo: LEGAJO_ADMIN },
      update: { rol: Rol.SUPER_ADMIN },
      create: {
        legajo: LEGAJO_ADMIN,
        nombre: 'Chat Admin',
        funcionId: funcion.id,
        servicioId,
        rol: Rol.SUPER_ADMIN,
      },
    });

    personaAId = a.id;
    personaBId = b.id;
  });

  afterAll(async () => {
    await prisma.comentarioMes.deleteMany({
      where: { personaId: { in: [personaAId, personaBId] } },
    });
    await prisma.persona.deleteMany({
      where: { legajo: { in: [LEGAJO_A, LEGAJO_B, LEGAJO_ADMIN] } },
    });
    await app.close();
  });

  beforeEach(async () => {
    await prisma.comentarioMes.deleteMany({
      where: { month: MONTH, servicioId },
    });
  });

  it('POST y GET listan comentarios del hilo', async () => {
    await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        month: MONTH,
        servicioId,
        texto: 'Primer comentario del mes',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/comentarios-mes?month=${MONTH}&servicioId=${servicioId}`)
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].texto).toBe('Primer comentario del mes');
    expect(res.body[0].persona.legajo).toBe(LEGAJO_A);
  });

  it('autor puede editar su comentario', async () => {
    const created = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        month: MONTH,
        servicioId,
        texto: 'Original',
      })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .patch(`/comentarios-mes/${id}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({ texto: 'Editado por autor' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/comentarios-mes/${id}`)
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({ texto: 'Intento ajeno' })
      .expect(403);
  });

  it('autor borra el suyo; admin borra cualquiera', async () => {
    const deA = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({ month: MONTH, servicioId, texto: 'De A' })
      .expect(201);

    const deB = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({ month: MONTH, servicioId, texto: 'De B' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/comentarios-mes/${deB.body.id}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/comentarios-mes/${deA.body.id}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/comentarios-mes/${deB.body.id}`)
      .set('X-Shift-Legajo', String(LEGAJO_ADMIN))
      .expect(200);

    const list = await request(app.getHttpServer())
      .get(`/comentarios-mes?month=${MONTH}&servicioId=${servicioId}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(200);

    expect(list.body).toHaveLength(0);
  });

  it('rechaza texto mayor a 250 caracteres', async () => {
    await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        month: MONTH,
        servicioId,
        texto: 'x'.repeat(251),
      })
      .expect(400);
  });

  it('POST con respondidoAId crea respuesta en el mismo hilo', async () => {
    const padre = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        month: MONTH,
        servicioId,
        texto: 'Mensaje original',
      })
      .expect(201);

    const resp = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({
        month: MONTH,
        servicioId,
        texto: 'Mi respuesta',
        respondidoAId: padre.body.id,
      })
      .expect(201);

    expect(resp.body.respondidoAId).toBe(padre.body.id);
    expect(resp.body.respondidoA.texto).toBe('Mensaje original');
    expect(resp.body.respondidoA.persona.legajo).toBe(LEGAJO_A);

    const list = await request(app.getHttpServer())
      .get(`/comentarios-mes?month=${MONTH}&servicioId=${servicioId}`)
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .expect(200);

    expect(list.body).toHaveLength(2);
    expect(list.body[1].respondidoAId).toBe(padre.body.id);
  });

  it('rechaza respondidoAId de otro hilo', async () => {
    const padre = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({ month: MONTH, servicioId, texto: 'En agosto' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_B))
      .send({
        month: '2026-07',
        servicioId,
        texto: 'Mal mes',
        respondidoAId: padre.body.id,
      })
      .expect(400);
  });

  it('acepta solo imagen meme y rechaza URLs no imagen', async () => {
    const ok = await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        month: MONTH,
        servicioId,
        texto: '',
        imagenUrl: 'https://cdn.example.com/meme.gif',
      })
      .expect(201);

    expect(ok.body.imagenUrl).toContain('.gif');
    expect(ok.body.texto).toBe('');

    await request(app.getHttpServer())
      .post('/comentarios-mes')
      .set('X-Shift-Legajo', String(LEGAJO_A))
      .send({
        month: MONTH,
        servicioId,
        imagenUrl: 'https://evil.com/app.vue',
      })
      .expect(400);
  });
});
