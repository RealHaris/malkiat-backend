import { Controller, Get, Query } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { DI } from '@app/di.tokens';
import { SearchListingsQuery } from '@modules/listing-discovery/application/queries/search-listings.query';
import { API_OPERATIONS, API_RESPONSES } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';

import type { DiscoverListingsQueryDto } from '@modules/listing-discovery/presentation/dto/discover-listings-query.dto';
import type { SearchListingsQueryDto } from '@modules/listing-discovery/presentation/dto/search-listings-query.dto';
import { discoverListingsQuerySchema } from '@modules/listing-discovery/presentation/dto/discover-listings-query.dto';
import { searchListingsQuerySchema } from '@modules/listing-discovery/presentation/dto/search-listings-query.dto';

@ApiTags('public-listings')
@Controller('public/listings')
@AllowAnonymous()
export class PublicListingsController {
  constructor(
    @Inject(DI.ListingRepository) private readonly listingRepo: ListingRepository,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation(API_OPERATIONS.GET_PUBLIC_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  async list(
    @Query(new ZodValidationPipe(discoverListingsQuerySchema))
    dto: DiscoverListingsQueryDto,
  ) {
    const result = await this.listingRepo.listPublic({
      city: dto.city,
      page: dto.page,
      perPage: dto.perPage,
      sort: dto.sort,
    });

    return {
      items: result.items.map((x) => x.snapshot),
      page: dto.page,
      perPage: dto.perPage,
      total: result.total,
    };
  }

  @Get('discovery')
  @ApiOperation(API_OPERATIONS.DISCOVER_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  async discovery(
    @Query(new ZodValidationPipe(discoverListingsQuerySchema))
    dto: DiscoverListingsQueryDto,
  ) {
    const result = await this.listingRepo.listPublic({
      city: dto.city,
      page: dto.page,
      perPage: dto.perPage,
      sort: dto.sort,
    });

    return {
      items: result.items.map((x) => x.snapshot),
      page: dto.page,
      perPage: dto.perPage,
      total: result.total,
    };
  }

  @Get('search')
  @ApiOperation(API_OPERATIONS.SEARCH_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Search results'))
  async search(
    @Query(new ZodValidationPipe(searchListingsQuerySchema))
    dto: SearchListingsQueryDto,
  ) {
    const result = await this.queryBus.execute(
      new SearchListingsQuery({
        q: dto.q,
        city: dto.city,
        areaIds: dto.areaIds,
        purpose: dto.purpose as any,
        propertyCategory: dto.propertyCategory as any,
        propertySubtypeId: dto.propertySubtypeId,
        minAreaSqft: dto.minAreaSqft,
        maxAreaSqft: dto.maxAreaSqft,
        bedroomsCount: dto.bedroomsCount,
        page: dto.page,
        perPage: dto.perPage,
        sort: dto.sort,
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
      }),
    );

    return {
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      total: result.found,
    };
  }
}
