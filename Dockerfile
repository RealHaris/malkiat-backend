FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY nest-cli.json tsconfig.json tsconfig.build.json tsconfig.tsgo.json drizzle.config.ts ./
COPY src ./src
COPY scripts ./scripts

RUN npx nest build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/infrastructure/db/drizzle/migrations ./src/infrastructure/db/drizzle/migrations

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
