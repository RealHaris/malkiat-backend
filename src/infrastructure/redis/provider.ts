import { Provider } from '@nestjs/common';
import { APP_ENV } from '../../shared/config/config.constants';
import { DI } from '@app/di.tokens';
import type { AppEnv } from '@shared/config/env';
import { createRedisClient } from './client';

export const RedisClientProvider: Provider = {
  provide: DI.RedisClient,
  inject: [APP_ENV],
  useFactory: (env: AppEnv) => {
    if (!env.REDIS_URL) {
      throw new Error('REDIS_URL is required to initialize Redis');
    }
    return createRedisClient(env.REDIS_URL);
  },
};
