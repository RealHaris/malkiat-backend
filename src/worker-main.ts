import { NestFactory } from '@nestjs/core';
import { AppWorkerModule } from './app/app.worker.module';

async function bootstrap() {
  // Worker app does not expose HTTP server.
  await NestFactory.createApplicationContext(AppWorkerModule);
}

bootstrap();
