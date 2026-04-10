import { Provider } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';

export const ListingEventsQueueProvider: Provider = {
  provide: DI.ListingEventsQueue,
  inject: [APP_ENV, DI.BullmqConnection],
  useFactory: (env: AppEnv, connection: ConnectionOptions) => {
    return new Queue(env.LISTING_EVENTS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: { age: 60 * 60 },
        removeOnFail: { age: 24 * 60 * 60 },
        attempts: 5,
        backoff: { type: 'exponential', delay: 500 },
      },
    });
  },
};
