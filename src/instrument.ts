import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://9945e0cf32ea67b6ccd0341073a8aef5@o4510598785204224.ingest.us.sentry.io/4511441113120768',
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  environment: process.env.NODE_ENV ?? 'development',
});
