import { Provider } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';

export const ListingEventsWorkerProvider: Provider = {
  provide: 'ListingEventsWorker',
  inject: [APP_ENV, DI.BullmqConnection],
  useFactory: (env: AppEnv, connection: ConnectionOptions) => {
    return new Worker(
      env.LISTING_EVENTS_QUEUE_NAME,
      async (job) => {
        // Placeholder: each event becomes its own async job.
        // We'll wire actual projections/side-effects in follow-ups.
        await Promise.resolve();
        return { ok: true, event: String(job.name) };
      },
      {
        connection,
        concurrency: 10,
      },
    );
  },
};
