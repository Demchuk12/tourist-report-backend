import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const build = async (queryRaw: () => Promise<unknown>) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();

    return moduleRef.get(HealthController);
  };

  it('reports the database as up when the probe query succeeds', async () => {
    const controller = await build(() => Promise.resolve([{ '?column?': 1 }]));

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('degrades instead of throwing when the database is unreachable', async () => {
    const controller = await build(() =>
      Promise.reject(new Error('ECONNREFUSED')),
    );

    await expect(controller.check()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });
});
