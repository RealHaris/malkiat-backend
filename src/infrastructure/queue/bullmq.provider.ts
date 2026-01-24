import { Provider } from "@nestjs/common";
import type { ConnectionOptions } from "bullmq";

import { DI } from "@app/di.tokens";
import { APP_ENV } from "@shared/config/config.constants";
import type { AppEnv } from "@shared/config/env";

import { createBullmqConnection } from "@infra/queue/bullmq.connection";

export const BullmqConnectionProvider: Provider = {
  provide: DI.BullmqConnection,
  inject: [APP_ENV],
  useFactory: (env: AppEnv): ConnectionOptions => {
    try {
      const redisUrl = env.BULLMQ_REDIS_URL ?? env.REDIS_URL;
      if (!redisUrl) {
        throw new Error("BULLMQ_REDIS_URL or REDIS_URL is required to initialize BullMQ");
      }
      const connection = createBullmqConnection(redisUrl);
      console.log("✅ Redis Linked to BullMQ successfully");
      return connection;
    } catch (error) {
      console.error("❌ Failed to link Redis to BullMQ:");
      console.error(error);
      throw error;
    }
  },
};
