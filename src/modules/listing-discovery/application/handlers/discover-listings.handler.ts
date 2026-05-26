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
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { Listing } from '@modules/listing-management/domain/listing.aggregate';

function toListingCard(listing: Listing): ListingCard {
  const s = listing.snapshot;
  return {
    ...s,
    areaValue: Number(s.areaValue ?? 0),
    areaSqft: Number(s.areaSqft ?? 0),
    priceAmount: Number(s.priceAmount ?? 0),
    publishedAt: s.publishedAt ? Number(new Date(s.publishedAt).getTime()) : null,
    createdAt: s.createdAt ? Number(new Date(s.createdAt).getTime()) : 0,
  } as ListingCard;
}

@QueryHandler(DiscoverListingsQuery)
export class DiscoverListingsHandler implements IQueryHandler<DiscoverListingsQuery> {
  constructor(
    @Inject(DI.TypesenseClient) private readonly typesense: TypesenseClient,
    @Inject(APP_ENV) private readonly env: AppEnv,
    @Inject(DI.ListingRepository) private readonly listingRepo: ListingRepository,
  ) {}

  async execute(query: DiscoverListingsQuery): Promise<PaginatedResult<ListingCard>> {
    const page = query.input.page ?? 1;
    const perPage = query.input.perPage ?? 20;

    try {
      const search = new TypesenseListingsSearch(this.typesense as any);
      return await search.discover({
        collection: this.env.TYPESENSE_COLLECTION_LISTINGS,
        page,
        perPage,
        city: query.input.city,
        sort: query.input.sort,
        minPrice: query.input.minPrice,
        maxPrice: query.input.maxPrice,
        areaIds: query.input.areaIds,
        excludeAreaIds: query.input.excludeAreaIds,
        purpose: query.input.purpose,
        propertyCategory: query.input.propertyCategory,
        propertySubtypeId: query.input.propertySubtypeId,
        minAreaSqft: query.input.minAreaSqft,
        maxAreaSqft: query.input.maxAreaSqft,
        bedroomsCount: query.input.bedroomsCount,
      });
    } catch {
      const result = await this.listingRepo.listPublic({
        city: query.input.city,
        page,
        perPage,
        sort: query.input.sort,
        minPrice: query.input.minPrice,
        maxPrice: query.input.maxPrice,
        areaIds: query.input.areaIds,
        excludeAreaIds: query.input.excludeAreaIds,
        purpose: query.input.purpose,
        propertyCategory: query.input.propertyCategory,
        propertySubtypeId: query.input.propertySubtypeId,
        minAreaSqft: query.input.minAreaSqft,
        maxAreaSqft: query.input.maxAreaSqft,
        bedroomsCount: query.input.bedroomsCount,
      });

      return {
        items: result.items.map(toListingCard),
        page,
        perPage,
        found: result.total,
      };
    }
  }
}
