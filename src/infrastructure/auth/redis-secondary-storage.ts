import type { RedisClient } from '@infra/redis/client';

// Minimal wrapper around Better Auth's SecondaryStorage interface.
// The package does not export a runtime type; we keep this structural.
export type BetterAuthSecondaryStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export function createRedisSecondaryStorage(
  client: RedisClient,
): BetterAuthSecondaryStorage {
  return {
    get: async (key) => {
      return client.get(key);
    },
    set: async (key, value, ttlSeconds) => {
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, value, 'EX', ttlSeconds);
        return;
      }
      await client.set(key, value);
    },
    delete: async (key) => {
      await client.del(key);
    },
  };
}
