#!/bin/sh
set -e

# Migrations run on every boot. `migrate deploy` applies only what is missing
# and never generates or resets, so a restart with nothing new is a no-op — and
# a fresh database is set up without a separate manual step.
echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Starting the API"
exec "$@"
