# tourist-report-backend

REST API for the [tourist-report](../tourist-report) PWA: tours, tourists, excursions and
receipt attachments.

**Stack:** NestJS 12 (ESM) · TypeScript · Prisma 7 + PostgreSQL · class-validator · Swagger.

## Getting started

```bash
cp .env.example .env         # then set DATABASE_URL if your Postgres differs
npm run db:up                # docker compose up -d postgres (skip if you already run Postgres)
npm run prisma:generate      # generate the Prisma client
npm run prisma:deploy        # apply prisma/migrations to the database
npm run start:dev
```

- API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`
- Health: `GET /api/health` (also reports whether the database answers)

> `npm run db:up` needs Docker. On a machine that already runs PostgreSQL, point
> `DATABASE_URL` at it instead and skip that step.

An initial migration (`prisma/migrations/20260903000000_init`) is committed, so a fresh
database only needs `prisma:deploy`. Use `npm run prisma:migrate` when you change
`prisma/schema.prisma` and want a new migration generated.

## Configuration (`.env`)

| Variable           | Default                        | Meaning                                            |
| ------------------ | ------------------------------ | -------------------------------------------------- |
| `DATABASE_URL`     | —                              | Postgres connection string (required)               |
| `PORT`             | `3000`                         | HTTP port                                           |
| `CORS_ORIGIN`      | `http://localhost:5173`        | Comma-separated allowed origins (SvelteKit dev)     |
| `UPLOAD_DIR`       | `uploads`                      | Where receipt bytes are written                     |
| `MAX_UPLOAD_BYTES` | `10485760`                     | Per-file limit for receipts                         |
| `JWT_SECRET`       | —                              | Access token signing key (required)                 |
| `JWT_EXPIRES_IN`   | `7d`                           | Access token lifetime                               |

## Authentication

Every endpoint requires a bearer token except `GET /api/health` and the two login
routes. `JwtAuthGuard` is registered globally through `APP_GUARD`, so a new controller
is protected the moment it is added and has to opt out explicitly with `@Public()` —
a forgotten decorator fails closed rather than open.

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tourist-report.local","password":"admin12345"}' | jq -r .accessToken)

curl http://localhost:3000/api/tours -H "Authorization: Bearer $TOKEN"
```

In the Swagger UI, press **Authorize** and paste the token.

### Development accounts

`npm run prisma:seed` upserts by a fixed id (accounts by email), so re-running it
converges on the same demo set instead of duplicating rows. They are development
credentials — do not ship them.

| Email                        | Password      | Role     |
| ---------------------------- | ------------- | -------- |
| `admin@tourist-report.local` | `admin12345`  | `admin`  |
| `leader@tourist-report.local`| `leader12345` | `leader` |

### Who sees what

A tour belongs to the account that created it (`Tour.ownerId`, set from the token rather
than the request body). `GET /api/tours` returns only the caller's own tours, and another
leader's tour reads as `404` rather than `403`, so the id space cannot be probed for which
tours exist. An `admin` is exempt from the scope and sees every tour.

Tourists and excursions stay shared: an excursion can be booked by tours belonging to
different leaders, so scoping it to one owner would misreport participants.

### Demo data

Alongside the accounts, the seed writes 20 tourists, 10 excursions and four tours — two
per account:

| Tour               | Owner    | Status      | Tourists | Excursions |
| ------------------ | -------- | ----------- | -------- | ---------- |
| `Карпати, травень` | `admin`  | `active`    | 6        | 3          |
| `Одеса, липень`    | `admin`  | `planned`   | 7        | 2          |
| `Львів вікенд`     | `leader` | `completed` | 5        | 3          |
| `Буковель, зима`   | `leader` | `planned`   | 5        | 2          |

Two tourists travel on both admin tours and one on both leader tours, so the derived
participant list is exercised by real overlap. Four excursions carry payments, and the
statuses cover `pending`, `completed` and `cancelled`.

### Password storage

Hashes use node's built-in `scrypt` (`node:crypto`) rather than bcrypt, so password
storage adds no native dependency to rebuild on each Node upgrade. The stored form is
`scrypt:<salt>:<key>`, comparison is `timingSafeEqual`, and a wrong password and an
unknown email return the same `401` so the endpoint cannot enumerate accounts.

## Endpoints

| Method   | Path                                       | Notes                                             |
| -------- | ------------------------------------------ | ------------------------------------------------- |
| `POST`   | `/api/auth/register`                       | Public; returns a token                            |
| `POST`   | `/api/auth/login`                          | Public; returns a token                            |
| `GET`    | `/api/auth/me`                             | The account behind the current token               |
| `GET`    | `/api/tours?status=`                       | Newest first; own tours only unless `admin`        |
| `GET`    | `/api/tours/:id`                           |                                                    |
| `POST`   | `/api/tours`                               | Owner taken from the token                         |
| `PATCH`  | `/api/tours/:id`                           | `touristIds`/`excursionIds` replace the membership |
| `DELETE` | `/api/tours/:id`                           | `204`                                              |
| `GET`    | `/api/tourists?search=`                    | Search over name, phone, email, document           |
| `GET`    | `/api/tourists/:id`                        |                                                    |
| `POST`   | `/api/tourists`                            |                                                    |
| `PATCH`  | `/api/tourists/:id`                        |                                                    |
| `DELETE` | `/api/tourists/:id`                        | Cascades out of tours and payments                 |
| `GET`    | `/api/excursions?status=`                  |                                                    |
| `GET`    | `/api/excursions/:id`                      |                                                    |
| `GET`    | `/api/excursions/:id/participants`         | Derived from the tours that include it             |
| `POST`   | `/api/excursions`                          |                                                    |
| `PATCH`  | `/api/excursions/:id`                      |                                                    |
| `PUT`    | `/api/excursions/:id/payments/:touristId`  | Mark paid                                          |
| `DELETE` | `/api/excursions/:id/payments/:touristId`  | Mark unpaid                                        |
| `DELETE` | `/api/excursions/:id`                      | Deletes its receipt rows too                       |
| `GET`    | `/api/excursions/:id/receipts`             | Attachment metadata                                |
| `POST`   | `/api/excursions/:id/receipts`             | `multipart/form-data`, field `file`                |
| `GET`    | `/api/attachments/:id`                     | Metadata                                           |
| `GET`    | `/api/attachments/:id/content`             | The bytes                                          |
| `DELETE` | `/api/attachments/:id`                     | `204`                                              |

## Deployment

The stack runs as three containers on a single host: the API, its Postgres, and Caddy
terminating TLS in front. `compose.prod.yml` wires them together; the development
`docker-compose.yml` is untouched and still just publishes a bare Postgres for
`npm run start:dev`.

```bash
cp .env.production.example .env.production   # then fill it in
docker compose --env-file .env.production -f compose.prod.yml up -d --build
```

`docker-entrypoint.sh` runs `prisma migrate deploy` before the API starts, so a fresh
database is set up on first boot and a restart with no new migrations is a no-op.

### Why it is arranged this way

- **Receipts need a real volume.** `AttachmentsService` writes bytes to `UPLOAD_DIR`,
  so the `uploads` volume is what keeps them across a redeploy. On a platform with an
  ephemeral filesystem the `Attachment` rows would survive and their files would not.
- **Postgres publishes no port.** It is reachable only over the compose network; only
  Caddy is exposed to the internet.
- **The runtime image keeps its full `node_modules`.** The generated Prisma client
  lives there and the entrypoint needs the Prisma CLI for `migrate deploy`, so a
  `--omit=dev` install would have to reassemble both by hand. Size is traded for a
  runtime that cannot drift from the build.
- **`caddy-data` holds the issued certificates.** Losing that volume means re-issuing
  and running into Let's Encrypt rate limits.

### Before the first deploy

1. **Never run `npm run prisma:seed` against production.** It creates
   `admin@tourist-report.local` with the password `admin12345`. Create the real first
   account through `POST /api/auth/register` instead, then delete or disable the route
   if the API should not accept public sign-ups.
2. **Generate a real `JWT_SECRET`** — `openssl rand -hex 32`. The value in `.env` is a
   development placeholder, and anyone holding it can mint valid tokens.
3. **Point `CORS_ORIGIN` at the deployed PWA**, not at the API's own domain. It stays
   `http://localhost:5173` otherwise and the browser will block every call.
4. **Set an A record for `APP_DOMAIN`** before starting the stack, and open ports 80
   and 443 — Caddy needs both to complete the ACME challenge.

### Backups

Nothing backs the database up on its own:

```bash
docker compose -f compose.prod.yml exec -T postgres \
  pg_dump -U tourist tourist_report | gzip > backup-$(date +%F).sql.gz
```

The `uploads` volume needs the same treatment — the database rows are useless without
the files they point at.

## Design notes

Decisions worth keeping, mirrored from the client so both sides agree:

- **Dates are strings.** `startDate`/`endDate`/`date` are `YYYY-MM-DD` and `time` is `HH:mm`,
  stored verbatim — the same opaque calendar values the PWA uses, with no timezone
  conversion anywhere. Only `createdAt`/`updatedAt` are real timestamps.
- **Excursion status is recorded, never derived** from the date: the leader states what
  actually happened. Only `completed` excursions are billable.
- **Payments store who has paid.** `paidTouristIds` holds the payers; absence means unpaid,
  so tour membership can change without touching payment records.
- **Participation is derived, not stored.** There is no excursion→tourist relation: whoever
  is on a tour that includes the excursion takes part in it, and someone booked through two
  tours appears once with both tour names (`GET /api/excursions/:id/participants`).
- **Binaries never go into the document.** `Attachment` rows carry metadata only; the bytes
  live in `UPLOAD_DIR` under the attachment id. The row is written before the file, so a
  failure can only orphan bytes, never leave a row pointing at nothing.
- **Relation arrays are replaced, not merged.** `PATCH` with `touristIds` sets the exact
  membership, matching how the client store holds it.

## Scripts

```bash
npm run start:dev     # watch mode
npm run build         # nest build
npm run typecheck     # tsc --noEmit
npm run lint          # oxlint
npm test              # unit tests (vitest)
npm run test:e2e      # HTTP tests with the database stubbed out
npm run prisma:seed   # (re)create the development accounts
npm run prisma:studio # browse the data
```
