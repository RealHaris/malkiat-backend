import { NestFactory } from '@nestjs/core';
import { AppApiModule } from './app/app.api.module';
import { APP_ENV } from './shared/config/config.constants';
import type { AppEnv } from './shared/config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppApiModule);
  const env = app.get<AppEnv>(APP_ENV);
  await app.listen(env.PORT);
}
bootstrap();
