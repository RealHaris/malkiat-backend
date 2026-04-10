import { NestFactory } from '@nestjs/core';
import { AppApiModule } from '@app/app.api.module';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppApiModule, {
      bodyParser: false,
    });

    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    const env = app.get<AppEnv>(APP_ENV);

    const allowedOrigins = [env.APP_PUBLIC_URL, env.BETTER_AUTH_BASE_URL].filter(
      (origin): origin is string => !!origin && origin !== 'undefined',
    );

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    });

    const config = new DocumentBuilder()
      .setTitle('Malkiat Backend API')
      .setDescription('API documentation for Malkiat Backend')
      .setVersion('1.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Enter your session token (no "Bearer " prefix required)',
        },
        'session-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    let port = env.PORT;
    let listening = false;
    const maxAttempts = 10;
    let attempt = 0;

    while (!listening && attempt < maxAttempts) {
      try {
        await app.listen(port);
        listening = true;
      } catch (error: any) {
        if (error.code === 'EADDRINUSE' && attempt < maxAttempts - 1) {
          port++;
          attempt++;
        } else {
          throw error;
        }
      }
    }

    const serverUrl = `http://localhost:${port}`;
    console.log('\n');
    console.log('─────────────────────────────────────────');
    console.log('✅ Malkiat Backend is running successfully!');
    console.log('─────────────────────────────────────────');
    console.log(`📍 Server URL: ${serverUrl}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`📡 Port: ${port}`);
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
