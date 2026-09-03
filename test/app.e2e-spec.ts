import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  /** Signed from the app's own JwtService, so the global guard really verifies it. */
  let auth: string;

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

    const token = await moduleRef.get(JwtService).signAsync({
      sub: '00000000-0000-4000-8000-000000000000',
      email: 'e2e@tourist-report.local',
      role: 'admin',
    });
    auth = `Bearer ${token}`;
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

  it('rejects a protected route without a token', async () => {
    await request(app.getHttpServer()).get('/api/tours').expect(401);
  });

  it('rejects a tampered token', async () => {
    await request(app.getHttpServer())
      .get('/api/tours')
      .set('Authorization', `${auth}tampered`)
      .expect(401);
  });

  it('lists tours', async () => {
    await request(app.getHttpServer())
      .get('/api/tours')
      .set('Authorization', auth)
      .expect(200)
      .expect([]);
  });

  it('rejects a tour without a name', async () => {
    await request(app.getHttpServer())
      .post('/api/tours')
      .set('Authorization', auth)
      .send({ destination: 'Львів' })
      .expect(400);
  });

  it('rejects an unknown field', async () => {
    await request(app.getHttpServer())
      .post('/api/tours')
      .set('Authorization', auth)
      .send({ name: 'Тур', nope: true })
      .expect(400);
  });
});
