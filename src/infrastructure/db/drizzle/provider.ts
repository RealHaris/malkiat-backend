import { Provider } from "@nestjs/common";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createDrizzleDb } from "./client";
import { DI } from "@app/di.tokens";
import { APP_ENV } from "@shared/config/config.constants";
import type { AppEnv } from "@shared/config/env";

export type AppDb = PostgresJsDatabase<Record<string, never>>;

export const DrizzleDbProvider: Provider = {
  provide: DI.DrizzleDb,
  inject: [APP_ENV],
  useFactory: (env: AppEnv) => {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required to initialize the database");
    }
    return createDrizzleDb(env.DATABASE_URL);
  },
};
