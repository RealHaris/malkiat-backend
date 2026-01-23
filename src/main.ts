import { NestFactory } from '@nestjs/core';
import { AppApiModule } from '@app/app.api.module';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppApiModule, {
    bodyParser: false,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const env = app.get<AppEnv>(APP_ENV);
  await app.listen(env.PORT);
}
void bootstrap();
