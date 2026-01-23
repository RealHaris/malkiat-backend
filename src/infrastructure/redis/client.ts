import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export function createRedisClient(url: string) {
  const client = createClient({ url });
  return client;
}
