import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DI } from '@app/di.tokens';
import { DrizzleListingRepository } from '@modules/listing-management/infrastructure/drizzle/drizzle-listing.repository';

import { PublicListingsController } from './presentation/public-listings.controller';
import { DiscoverListingsHandler } from './application/handlers/discover-listings.handler';
import { SearchListingsHandler } from './application/handlers/search-listings.handler';

const queryHandlers = [DiscoverListingsHandler, SearchListingsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PublicListingsController],
  providers: [
    ...queryHandlers,
    {
      provide: DI.ListingRepository,
      inject: [DI.DrizzleDb],
      useFactory: (db: PostgresJsDatabase<any>) => new DrizzleListingRepository(db),
    },
  ],
})
export class ListingDiscoveryModule {}
