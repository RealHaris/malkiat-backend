import { Global, Module } from "@nestjs/common";
import { DrizzleDbProvider } from "@infra/db/drizzle/provider";
import { RedisClientProvider } from "@infra/redis/provider";
import { BullmqConnectionProvider } from "@infra/queue/bullmq.provider";
import { ListingEventsQueueProvider } from "@infra/queue/listing-events-queue.provider";
import { TypesenseClientProvider } from "@infra/typesense/provider";

@Global()
@Module({
  providers: [
    DrizzleDbProvider,
    RedisClientProvider,
    TypesenseClientProvider,
    BullmqConnectionProvider,
    ListingEventsQueueProvider,
  ],
  exports: [
    DrizzleDbProvider,
    RedisClientProvider,
    TypesenseClientProvider,
    BullmqConnectionProvider,
    ListingEventsQueueProvider,
  ],
})
export class InfrastructureModule {}
