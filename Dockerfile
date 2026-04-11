FROM oven/bun:1.2.15 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY nest-cli.json tsconfig.json tsconfig.build.json tsconfig.tsgo.json drizzle.config.ts ./
COPY src ./src
COPY scripts ./scripts

RUN bun x nest build

FROM oven/bun:1.2.15 AS runtime

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/infrastructure/db/drizzle/migrations ./src/infrastructure/db/drizzle/migrations

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "dist/main.js"]
