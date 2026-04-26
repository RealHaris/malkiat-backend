# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.11-slim AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile

FROM deps AS build

WORKDIR /app

COPY nest-cli.json tsconfig.json tsconfig.build.json tsconfig.docker.json drizzle.config.ts ./
COPY src ./src
COPY scripts ./scripts

RUN bun x nest build --path tsconfig.docker.json

FROM oven/bun:1.3.11-slim AS prod-deps

WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile --production

FROM oven/bun:1.3.11-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY --from=prod-deps /app/node_modules ./node_modules

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/infrastructure/db/drizzle/migrations ./src/infrastructure/db/drizzle/migrations

EXPOSE 3000

CMD ["bun", "dist/main.js"]
