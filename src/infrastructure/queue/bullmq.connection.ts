import type { ConnectionOptions } from 'bullmq';

export function createBullmqConnection(redisUrl: string): ConnectionOptions {
  return { url: redisUrl };
}
