import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { PublicListingsController } from "./presentation/public-listings.controller";
import { DiscoverListingsHandler } from "./application/handlers/discover-listings.handler";
import { SearchListingsHandler } from "./application/handlers/search-listings.handler";

const queryHandlers = [DiscoverListingsHandler, SearchListingsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PublicListingsController],
  providers: [...queryHandlers],
})
export class ListingDiscoveryModule {}
