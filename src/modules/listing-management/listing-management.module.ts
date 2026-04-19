import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Queue } from 'bullmq';

import { DI } from '@app/di.tokens';
import { AgenciesModule } from '@modules/identity-access/agencies/agencies.module';

import { CreateListingHandler } from './application/handlers/create-listing.handler';
import { DeleteListingHandler } from './application/handlers/delete-listing.handler';
import { UpdateListingHandler } from './application/handlers/update-listing.handler';
import { DrizzleListingRepository } from './infrastructure/drizzle/drizzle-listing.repository';
import { BullmqListingEventsPublisher } from './infrastructure/queue/bullmq-listing-events.publisher';
import { ListingsController } from './presentation/listings.controller';
import { ListingMediaController } from './presentation/listing-media.controller';

const commandHandlers = [CreateListingHandler, UpdateListingHandler, DeleteListingHandler];

@Module({
  imports: [CqrsModule, AgenciesModule],
  controllers: [ListingsController, ListingMediaController],
  providers: [
    ...commandHandlers,
    {
      provide: DI.ListingRepository,
      inject: [DI.DrizzleDb],
      useFactory: (db: PostgresJsDatabase<any>) => new DrizzleListingRepository(db),
    },
    {
      provide: DI.ListingEventsPublisher,
      inject: [DI.ListingEventsQueue],
      useFactory: (queue: Queue) => new BullmqListingEventsPublisher(queue),
    },
  ],
})
export class ListingManagementModule {}
