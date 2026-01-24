import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { DiscoverListingsQuery } from '@modules/listing-discovery/application/queries/discover-listings.query';
import { SearchListingsQuery } from '@modules/listing-discovery/application/queries/search-listings.query';

@Controller('public/listings')
@AllowAnonymous()
export class PublicListingsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('discovery')
  async discovery(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sort') sort?: 'newest' | 'price_asc' | 'price_desc',
    @Query('propertyType') propertyType?: string,
    @Query('currency') currency?: string,
  ) {
    return this.queryBus.execute(
      new DiscoverListingsQuery({
        page: page ? Number(page) : undefined,
        perPage: perPage ? Number(perPage) : undefined,
        sort,
        propertyType,
        currency,
      }),
    );
  }

  @Get('search')
  async search(
    @Query('q') q = '',
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sort') sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc',
    @Query('propertyType') propertyType?: string,
    @Query('currency') currency?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.queryBus.execute(
      new SearchListingsQuery({
        q,
        page: page ? Number(page) : undefined,
        perPage: perPage ? Number(perPage) : undefined,
        sort,
        propertyType,
        currency,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
    );
  }
}
