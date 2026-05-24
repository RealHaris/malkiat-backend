import { Module, Global } from '@nestjs/common';
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth';
import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createBetterAuthInstance } from '@infra/auth/better-auth.instance';
import { InfrastructureModule } from '@infra/infrastructure.module';
import { AuthOtpController } from './auth-otp.controller';
import { OtpRateLimiterService } from '@shared/auth/otp-rate-limiter.service';

let sharedAuthInstance: any = null;

const getOrCreateAuthInstance = (env: AppEnv, db: PostgresJsDatabase<any>) => {
  if (!sharedAuthInstance) {
    sharedAuthInstance = createBetterAuthInstance(env, db);
  }
  return sharedAuthInstance;
};

@Global()
@Module({
  imports: [
    InfrastructureModule,
    BetterAuthNestModule.forRootAsync({
      inject: [APP_ENV, DI.DrizzleDb],
      useFactory: (env: AppEnv, db: PostgresJsDatabase<any>) => {
        return { auth: getOrCreateAuthInstance(env, db) };
      },
    }),
  ],
  controllers: [AuthOtpController],
  providers: [
    OtpRateLimiterService,
    {
      provide: DI.BetterAuth,
      inject: [APP_ENV, DI.DrizzleDb],
      useFactory: (env: AppEnv, db: PostgresJsDatabase<any>) => {
        return getOrCreateAuthInstance(env, db);
      },
    },
  ],
  exports: [OtpRateLimiterService, DI.BetterAuth],
})
export class IdentityAccessAuthModule {}
