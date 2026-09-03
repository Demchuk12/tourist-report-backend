import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Checked before defineConfig because `env()` resolves eagerly and reports a
// missing variable as "Failed to load config file", which says nothing about
// what is actually wrong. On a host this is the first thing that fails, so the
// message has to name the variable.
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Locally it comes from .env; on a hosting ' +
      'platform it must be configured in the service environment before the ' +
      'container starts.',
  );
}

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
