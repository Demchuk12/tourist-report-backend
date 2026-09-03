import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 keeps connection URLs out of the schema: the CLI reads them here,
 * and the application passes its own adapter to PrismaClient.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Node 24 runs the TypeScript seed directly, so no extra runner is needed.
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
