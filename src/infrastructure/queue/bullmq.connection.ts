import { ConnectionOptions } from 'bullmq';

export function createBullmqConnection(redisUrl: string): ConnectionOptions {
  // BullMQ supports ioredis options, but also accepts a connection object.
  // We keep it minimal and parse via URL in the queue/worker constructors.
  return { connection: { url: redisUrl } as any } as any;
}
