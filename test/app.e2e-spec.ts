import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Boots the real module graph with the database swapped for a stub, so the HTTP
 * wiring (global prefix, validation, routing) is covered without a live Postgres.
 */
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: () => Promise.resolve([{ '?column?': 1 }]),
        tour: { findMany: () => Promise.resolve([]) },
        tourist: { findMany: () => Promise.resolve([]) },
        excursion: { findMany: () => Promise.resolve([]) },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('reports health', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('lists tours', async () => {
    await request(app.getHttpServer()).get('/api/tours').expect(200).expect([]);
  });

  it('rejects a tour without a name', async () => {
    await request(app.getHttpServer())
      .post('/api/tours')
      .send({ destination: 'Львів' })
      .expect(400);
  });

  it('rejects an unknown field', async () => {
    await request(app.getHttpServer())
      .post('/api/tours')
      .send({ name: 'Тур', nope: true })
      .expect(400);
  });
});
