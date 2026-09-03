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

## Endpoints

| Method   | Path                                       | Notes                                             |
| -------- | ------------------------------------------ | ------------------------------------------------- |
| `GET`    | `/api/tours?status=`                       | List, newest first                                 |
| `GET`    | `/api/tours/:id`                           |                                                    |
| `POST`   | `/api/tours`                               |                                                    |
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
npm run prisma:studio # browse the data
```
