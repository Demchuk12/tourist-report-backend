# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Prisma 7 writes the generated client into node_modules, so generation has to
# happen before the build and survive into the runtime image.
#
# The placeholder URL is required only because prisma.config.ts resolves
# DATABASE_URL eagerly; generation never opens a connection, and the real value
# is supplied at runtime by compose. Without it the build fails with
# "Cannot resolve environment variable: DATABASE_URL".
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate \
  && npm run build


FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# node_modules is copied whole rather than reinstalled with --omit=dev. The
# generated Prisma client lives inside it, and the entrypoint needs the Prisma
# CLI to run `migrate deploy`, so a pruned install would have to reassemble both
# by hand. Image size is traded for a runtime that cannot drift from the build.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/uploads \
  && chown -R node:node /app/uploads

# Receipts are written by the app, so it must not run as root.
USER node

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
