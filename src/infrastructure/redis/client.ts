import Redis from 'ioredis';

export type RedisClient = Redis;

export function createRedisClient(url: string): RedisClient {
  const client = new Redis(url);

  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  client.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  return client;
}
