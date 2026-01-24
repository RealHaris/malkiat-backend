import { Provider } from "@nestjs/common";
import type { Client } from "typesense";
import { Client as TypesenseClientImpl } from "typesense";

import { DI } from "@app/di.tokens";
import { APP_ENV } from "@shared/config/config.constants";
import type { AppEnv } from "@shared/config/env";

export type TypesenseClient = Client;

export const TypesenseClientProvider: Provider = {
  provide: DI.TypesenseClient,
  inject: [APP_ENV],
  useFactory: (env: AppEnv) => {
    try {
      if (!env.TYPESENSE_HOST) {
        throw new Error("TYPESENSE_HOST is required to initialize Typesense");
      }
      if (!env.TYPESENSE_PORT) {
        throw new Error("TYPESENSE_PORT is required to initialize Typesense");
      }
      if (!env.TYPESENSE_PROTOCOL) {
        throw new Error("TYPESENSE_PROTOCOL is required to initialize Typesense");
      }
      if (!env.TYPESENSE_ADMIN_API_KEY) {
        throw new Error("TYPESENSE_ADMIN_API_KEY is required to initialize Typesense");
      }

      const client = new TypesenseClientImpl({
        nodes: [
          {
            host: env.TYPESENSE_HOST,
            port: env.TYPESENSE_PORT,
            protocol: env.TYPESENSE_PROTOCOL,
          },
        ],
        apiKey: env.TYPESENSE_ADMIN_API_KEY,
        retryIntervalSeconds: 5,
        connectionTimeoutSeconds: 60,
      });
      console.log("✅ Typesense client configured successfully");
      return client;
    } catch (error) {
      console.error("❌ Failed to initialize Typesense client:");
      console.error(error);
      throw error;
    }
  },
};
