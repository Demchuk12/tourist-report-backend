import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type UserRole } from '@prisma/client';
import { hashPassword } from '../src/auth/password.ts';

/**
 * Development accounts. Idempotent by email, so re-running the seed refreshes
 * the passwords instead of failing on the unique constraint.
 */
const ACCOUNTS: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}[] = [
  {
    email: 'admin@tourist-report.local',
    password: 'admin12345',
    fullName: 'Адміністратор',
    role: 'admin',
  },
  {
    email: 'leader@tourist-report.local',
    password: 'leader12345',
    fullName: 'Олена Ковальчук',
    role: 'leader',
  },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

for (const account of ACCOUNTS) {
  const passwordHash = await hashPassword(account.password);
  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: { passwordHash, fullName: account.fullName, role: account.role },
    create: {
      email: account.email,
      passwordHash,
      fullName: account.fullName,
      role: account.role,
    },
  });

  console.log(`seeded ${user.role.padEnd(6)} ${user.email} / ${account.password}`);
}

await prisma.$disconnect();
