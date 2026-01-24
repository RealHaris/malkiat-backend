import { Global, Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { APP_ENV } from "@shared/config/config.constants";
import type { AppEnv } from "@shared/config/env";
import { createAppLogger } from "./logger.factory";

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [APP_ENV],
      useFactory: (env: AppEnv) => ({
        instance: createAppLogger({
          level: env.LOG_LEVEL,
          dir: env.LOG_DIR,
          maxFiles: env.LOG_MAX_FILES,
          maxSize: env.LOG_MAX_SIZE,
        }),
      }),
    }),
  ],
  exports: [WinstonModule],
})
export class AppLoggerModule {}
