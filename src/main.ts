import { NestFactory } from '@nestjs/core';
import { AppApiModule } from '@app/app.api.module';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';


async function bootstrap() {
  try {

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

    const serverUrl = `http://localhost:${env.PORT}`;
    console.log('\n');
    console.log('─────────────────────────────────────────');
    console.log('✅ Malkiat Backend is running successfully!');
    console.log('─────────────────────────────────────────');
    console.log(`📍 Server URL: ${serverUrl}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`📡 Port: ${env.PORT}`);
    console.log('─────────────────────────────────────────\n');
  } catch (error) {
    console.error('\n');
    console.error('❌ Fatal error during bootstrap:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}
void bootstrap();
