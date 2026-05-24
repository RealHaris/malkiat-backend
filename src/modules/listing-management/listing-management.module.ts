import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import { AgenciesModule } from '@modules/identity-access/agencies/agencies.module';

import { CreateListingHandler } from './application/handlers/create-listing.handler';
import { ChangeListingStatusHandler } from './application/handlers/change-listing-status.handler';
import { DeleteListingHandler } from './application/handlers/delete-listing.handler';
import { UpdateListingHandler } from './application/handlers/update-listing.handler';
import { DrizzleListingRepository } from './infrastructure/drizzle/drizzle-listing.repository';
import { CfEventsPublisher } from './infrastructure/queue/cf-events.publisher';
import { ListingsController } from './presentation/listings.controller';

const commandHandlers = [
  CreateListingHandler,
  UpdateListingHandler,
  ChangeListingStatusHandler,
  DeleteListingHandler,
];

@Module({
  imports: [CqrsModule, AgenciesModule],
  controllers: [ListingsController],
  providers: [
    ...commandHandlers,
    {
      provide: DI.ListingRepository,
      inject: [DI.DrizzleDb],
      useFactory: (db: PostgresJsDatabase<any>) => new DrizzleListingRepository(db),
    },
    {
      provide: DI.ListingEventsPublisher,
      inject: [APP_ENV],
      useFactory: (env: AppEnv) => {
        return new CfEventsPublisher(env.LISTING_EVENTS_WORKER_URL);
      },
    },
  ],
})
export class ListingManagementModule {}
