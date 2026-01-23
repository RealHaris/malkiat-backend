import { Module } from '@nestjs/common';
import { DrizzleDbProvider } from '@infra/db/drizzle/provider';
import { RedisClientProvider } from '@infra/redis/provider';
import { BullmqConnectionProvider } from '@infra/queue/bullmq.provider';
import { ListingEventsQueueProvider } from '@infra/queue/listing-events-queue.provider';

@Module({
  providers: [
    DrizzleDbProvider,
    RedisClientProvider,
    BullmqConnectionProvider,
    ListingEventsQueueProvider,
  ],
  exports: [
    DrizzleDbProvider,
    RedisClientProvider,
    BullmqConnectionProvider,
    ListingEventsQueueProvider,
  ],
})
export class InfrastructureModule {}
