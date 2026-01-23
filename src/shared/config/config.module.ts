import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_ENV } from './config.constants';
import { loadEnv } from './env';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [
    {
      provide: APP_ENV,
      useFactory: () => loadEnv(process.env as Record<string, unknown>),
    },
  ],
  exports: [APP_ENV],
})
export class SharedConfigModule {}
