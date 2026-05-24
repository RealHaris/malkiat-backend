import { NestFactory } from '@nestjs/core';
import { AppLoggerService } from '@shared/logger/app-logger.service';
import { AppWorkerModule } from '@app/app.worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppWorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(AppLoggerService));
}

void bootstrap();
