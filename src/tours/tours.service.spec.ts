import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ToursService } from './tours.service.js';

const admin: AuthenticatedUser = {
  id: 'admin-id',
  email: 'admin@example.com',
  role: 'admin',
};
const leader: AuthenticatedUser = {
  id: 'leader-id',
  email: 'leader@example.com',
  role: 'leader',
};

describe('ToursService ownership', () => {
  const build = (tour: Record<string, unknown> = {}) => {
    const calls: Record<string, unknown>[] = [];
    const row = {
      id: 'tour-id',
      name: 'Карпати',
      destination: '',
      startDate: '',
      endDate: '',
      status: 'planned',
      notes: '',
      ownerId: 'leader-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      tourists: [],
      excursions: [],
      ...tour,
    };
    const prisma = {
      tour: {
        findMany: (args: Record<string, unknown>) => {
          calls.push(args);
          return Promise.resolve([row]);
        },
        findFirst: (args: Record<string, unknown>) => {
          calls.push(args);
          const where = args.where as { ownerId?: string };
          const visible = !where.ownerId || where.ownerId === row.ownerId;
          return Promise.resolve(visible ? row : null);
        },
        create: (args: Record<string, unknown>) => {
          calls.push(args);
          return Promise.resolve({
            ...row,
            ...(args.data as Record<string, unknown>),
            tourists: [],
            excursions: [],
          });
        },
        delete: () => Promise.resolve(row),
      },
    } as unknown as PrismaService;

    return { service: new ToursService(prisma), calls };
  };

  it('scopes the listing to the tours a leader owns', async () => {
    const { service, calls } = build();

    await service.findAll(leader);

    expect(calls[0].where).toEqual({ ownerId: 'leader-id' });
  });

  it('does not scope the listing for an admin', async () => {
    const { service, calls } = build();

    await service.findAll(admin);

    expect(calls[0].where).toEqual({});
  });

  it('keeps the status filter alongside the owner scope', async () => {
    const { service, calls } = build();

    await service.findAll(leader, 'active');

    expect(calls[0].where).toEqual({ ownerId: 'leader-id', status: 'active' });
  });

  it("reports another leader's tour as missing rather than forbidden", async () => {
    const { service } = build({ ownerId: 'someone-else' });

    await expect(service.findOne(leader, 'tour-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets an admin read a tour owned by someone else', async () => {
    const { service } = build({ ownerId: 'someone-else' });

    await expect(service.findOne(admin, 'tour-id')).resolves.toMatchObject({
      ownerId: 'someone-else',
    });
  });

  it('takes the owner from the token, not the request body', async () => {
    const { service } = build();

    const created = await service.create(leader, {
      name: 'Новий тур',
      ownerId: 'admin-id',
    } as never);

    expect(created.ownerId).toBe('leader-id');
  });
});
