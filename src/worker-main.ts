import { NestFactory } from '@nestjs/core';
import { AppWorkerModule } from '@app/app.worker.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  // Worker app does not expose HTTP server.
  const app = await NestFactory.createApplicationContext(AppWorkerModule, {
    logger: false,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
}

void bootstrap();
