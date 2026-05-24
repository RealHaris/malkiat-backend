import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  constructor() {
    super('Malkiat', {
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
      timestamp: true,
    });
  }

  error(message: unknown, stack?: string, context?: string): void {
    super.error(message, stack, context);
  }
}
