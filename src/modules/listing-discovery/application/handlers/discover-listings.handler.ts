import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import type { TypesenseClient } from '@infra/typesense/provider';

import { DiscoverListingsQuery } from '@modules/listing-discovery/application/queries/discover-listings.query';
import type { PaginatedResult } from '@modules/listing-discovery/application/types/paginated-result';
import type { ListingCard } from '@modules/listing-discovery/application/types/listing-card';
import { TypesenseListingsSearch } from '@modules/listing-discovery/infrastructure/typesense/listings.search';

@QueryHandler(DiscoverListingsQuery)
export class DiscoverListingsHandler implements IQueryHandler<DiscoverListingsQuery> {
  constructor(
    @Inject(DI.TypesenseClient) private readonly typesense: TypesenseClient,
    @Inject(APP_ENV) private readonly env: AppEnv,
  ) {}

  async execute(query: DiscoverListingsQuery): Promise<PaginatedResult<ListingCard>> {
    const page = query.input.page ?? 1;
    const perPage = query.input.perPage ?? 20;

    const search = new TypesenseListingsSearch(this.typesense as any);
    return search.discover({
      collection: this.env.TYPESENSE_COLLECTION_LISTINGS,
      page,
      perPage,
      city: query.input.city,
      sort: query.input.sort,
    });
  }
}
