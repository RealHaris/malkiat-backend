# Backend Agent Notes

- Project: `malkiat-backend`
- Project version: `0.0.1`
- Package manager: `bun` (recommended for consistency)
- Framework: `NestJS 11`
- Better Auth: `1.4.17`

## Commands

- Install: `bun install`
- Dev API: `bun run start:api:dev`
- Dev full: `bun run start:dev`
- Build: `bun run build`
- Test: `bun run test`

## Database (Drizzle)

- Push schema: `bunx drizzle-kit push`
- Generate migration: `bunx drizzle-kit generate`
- Run migrations: `bunx drizzle-kit migrate`
- Studio: `bunx drizzle-kit studio`
