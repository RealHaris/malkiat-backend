import { Module } from "@nestjs/common";
import { AuthModule as BetterAuthNestModule } from "@thallesp/nestjs-better-auth";
import { DI } from "@app/di.tokens";
import { APP_ENV } from "@shared/config/config.constants";
import type { AppEnv } from "@shared/config/env";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { RedisClient } from "@infra/redis/client";
import { createBetterAuthInstance } from "@infra/auth/better-auth.instance";
import { InfrastructureModule } from "@infra/infrastructure.module";

@Module({
  imports: [
    InfrastructureModule,
    BetterAuthNestModule.forRootAsync({
      inject: [APP_ENV, DI.DrizzleDb, DI.RedisClient],
      useFactory: (env: AppEnv, db: PostgresJsDatabase<any>, redis: RedisClient) => {
        const auth = createBetterAuthInstance(env, db, redis);
        return { auth };
      },
    }),
  ],
})
export class IdentityAccessAuthModule {}
