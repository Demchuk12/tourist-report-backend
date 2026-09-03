import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type ExcursionStatus,
  type TourStatus,
  type UserRole,
} from '@prisma/client';
import { hashPassword } from '../src/auth/password.ts';

/**
 * Development data. Every row carries a fixed id so the seed is idempotent:
 * re-running it refreshes the demo set in place instead of piling up duplicates
 * or tripping a unique constraint.
 */
const uuid = (kind: number, index: number): string =>
  `${kind}0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const userId = (i: number) => uuid(1, i);
const touristId = (i: number) => uuid(2, i);
const excursionId = (i: number) => uuid(3, i);
const tourId = (i: number) => uuid(4, i);

const ACCOUNTS: {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}[] = [
  {
    id: userId(1),
    email: 'admin@tourist-report.local',
    password: 'admin12345',
    fullName: 'Адміністратор',
    role: 'admin',
  },
  {
    id: userId(2),
    email: 'leader@tourist-report.local',
    password: 'leader12345',
    fullName: 'Олена Ковальчук',
    role: 'leader',
  },
];

const TOURIST_NAMES = [
  'Андрій Бондаренко',
  'Марія Шевченко',
  'Ігор Ткаченко',
  'Софія Мельник',
  'Дмитро Кравченко',
  'Наталія Бойко',
  'Олексій Коваль',
  'Вікторія Поліщук',
  'Роман Савченко',
  'Юлія Марченко',
  'Тарас Гриценко',
  'Ірина Лисенко',
  'Богдан Пилипенко',
  'Катерина Захарчук',
  'Сергій Данилюк',
  'Оксана Романюк',
  'Максим Гончаренко',
  'Аліна Петренко',
  'Володимир Сидоренко',
  'Христина Федорів',
];

const EXCURSIONS: {
  index: number;
  title: string;
  location: string;
  date: string;
  time: string;
  guide: string;
  status: ExcursionStatus;
  price: number;
}[] = [
  // Карпати, травень (admin)
  { index: 1, title: 'Гора Говерла', location: 'Ворохта', date: '2026-05-13', time: '07:00', guide: 'Петро Іванчук', status: 'completed', price: 850 },
  { index: 2, title: 'Водоспад Пробій', location: 'Яремче', date: '2026-05-14', time: '10:30', guide: 'Петро Іванчук', status: 'completed', price: 300 },
  { index: 3, title: 'Буковельські озера', location: 'Буковель', date: '2026-05-16', time: '09:00', guide: 'Ольга Дзюба', status: 'pending', price: 620 },
  // Одеса, липень (admin)
  { index: 4, title: 'Оперний театр', location: 'Одеса', date: '2026-07-08', time: '18:00', guide: 'Леся Гурська', status: 'pending', price: 450 },
  { index: 5, title: 'Катакомби Нерубайського', location: 'Нерубайське', date: '2026-07-09', time: '11:00', guide: 'Леся Гурська', status: 'pending', price: 700 },
  // Львів вікенд (leader)
  { index: 6, title: 'Оглядова вежа Ратуші', location: 'Львів', date: '2026-03-14', time: '12:00', guide: 'Олена Ковальчук', status: 'completed', price: 200 },
  { index: 7, title: 'Личаківський цвинтар', location: 'Львів', date: '2026-03-14', time: '15:00', guide: 'Олена Ковальчук', status: 'completed', price: 250 },
  { index: 8, title: 'Дегустація кави', location: 'Львів', date: '2026-03-15', time: '11:00', guide: 'Марко Дуда', status: 'cancelled', price: 400 },
  // Буковель, зима (leader)
  { index: 9, title: 'Гірськолижний інструктаж', location: 'Буковель', date: '2027-01-12', time: '09:30', guide: 'Марко Дуда', status: 'pending', price: 1200 },
  { index: 10, title: 'Вечір на полонині', location: 'Поляниця', date: '2027-01-13', time: '19:00', guide: 'Марко Дуда', status: 'pending', price: 550 },
];

const TOURS: {
  index: number;
  ownerIndex: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TourStatus;
  notes: string;
  excursions: number[];
  /** 1-based positions in TOURIST_NAMES. */
  tourists: number[];
}[] = [
  {
    index: 1,
    ownerIndex: 1,
    name: 'Карпати, травень',
    destination: 'Яремче',
    startDate: '2026-05-12',
    endDate: '2026-05-19',
    status: 'active',
    notes: 'Виїзд від центрального вокзалу о 6:00.',
    excursions: [1, 2, 3],
    tourists: [1, 2, 3, 4, 5, 6],
  },
  {
    index: 2,
    ownerIndex: 1,
    name: 'Одеса, липень',
    destination: 'Одеса',
    startDate: '2026-07-06',
    endDate: '2026-07-12',
    status: 'planned',
    notes: 'Готель біля Дерибасівської, поселення після 14:00.',
    excursions: [4, 5],
    // 5 and 6 also travel on the Carpathian tour, so the demo set contains
    // tourists booked through two tours at once.
    tourists: [5, 6, 7, 8, 9, 10, 11],
  },
  {
    index: 3,
    ownerIndex: 2,
    name: 'Львів вікенд',
    destination: 'Львів',
    startDate: '2026-03-13',
    endDate: '2026-03-15',
    status: 'completed',
    notes: 'Група здала звіт, чеки завантажені.',
    excursions: [6, 7, 8],
    tourists: [12, 13, 14, 15, 16],
  },
  {
    index: 4,
    ownerIndex: 2,
    name: 'Буковель, зима',
    destination: 'Буковель',
    startDate: '2027-01-11',
    endDate: '2027-01-17',
    status: 'planned',
    notes: 'Потрібен прокат спорядження на 4 осіб.',
    excursions: [9, 10],
    tourists: [16, 17, 18, 19, 20],
  },
];

/** Who has already paid, by excursion index → tourist positions. */
const PAYMENTS: Record<number, number[]> = {
  1: [1, 2, 3, 4],
  2: [1, 2, 3, 4, 5, 6],
  6: [12, 13, 14, 15, 16],
  7: [12, 13, 15],
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

/**
 * Keyed on email rather than the fixed id: an account seeded before these ids
 * existed keeps the id it already has, and its tours follow that id.
 */
const ownerIds = new Map<number, string>();

for (const [position, account] of ACCOUNTS.entries()) {
  const passwordHash = await hashPassword(account.password);
  const data = {
    email: account.email,
    passwordHash,
    fullName: account.fullName,
    role: account.role,
  };

  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: data,
    create: { id: account.id, ...data },
  });
  ownerIds.set(position + 1, user.id);
  console.log(`user       ${account.role.padEnd(6)} ${account.email} / ${account.password}`);
}

for (const [position, fullName] of TOURIST_NAMES.entries()) {
  const index = position + 1;
  const data = {
    fullName,
    phone: `+38067${String(1000000 + index).padStart(7, '0')}`,
    email: `tourist${index}@example.com`,
    documentNumber: `FA${String(100000 + index)}`,
    notes: '',
  };

  await prisma.tourist.upsert({
    where: { id: touristId(index) },
    update: data,
    create: { id: touristId(index), ...data },
  });
}
console.log(`tourists   ${TOURIST_NAMES.length}`);

for (const excursion of EXCURSIONS) {
  const { index, ...fields } = excursion;
  const data = { ...fields, notes: '' };

  await prisma.excursion.upsert({
    where: { id: excursionId(index) },
    update: data,
    create: { id: excursionId(index), ...data },
  });
}
console.log(`excursions ${EXCURSIONS.length}`);

for (const tour of TOURS) {
  const { index, ownerIndex, excursions, tourists, ...fields } = tour;
  // `set` rather than `connect`, so a re-run converges on exactly this
  // membership even if the rows were edited through the API in between.
  const relations = {
    tourists: { set: tourists.map((i) => ({ id: touristId(i) })) },
    excursions: { set: excursions.map((i) => ({ id: excursionId(i) })) },
  };

  const ownerId = ownerIds.get(ownerIndex) as string;

  await prisma.tour.upsert({
    where: { id: tourId(index) },
    update: { ...fields, ownerId, ...relations },
    create: {
      id: tourId(index),
      ...fields,
      ownerId,
      tourists: { connect: relations.tourists.set },
      excursions: { connect: relations.excursions.set },
    },
  });
  console.log(
    `tour       ${fields.name.padEnd(18)} owner=${ACCOUNTS[ownerIndex - 1].email.split('@')[0].padEnd(6)} ${tourists.length} tourists, ${excursions.length} excursions`,
  );
}

for (const [excursion, payers] of Object.entries(PAYMENTS)) {
  await prisma.excursion.update({
    where: { id: excursionId(Number(excursion)) },
    data: { paidBy: { set: payers.map((i) => ({ id: touristId(i) })) } },
  });
}
console.log(`payments   ${Object.keys(PAYMENTS).length} excursions marked paid`);

await prisma.$disconnect();
