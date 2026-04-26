import { Controller, Get, Query } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { SearchListingsQuery } from '@modules/listing-discovery/application/queries/search-listings.query';
import { DiscoverListingsQuery } from '@modules/listing-discovery/application/queries/discover-listings.query';
import { PublicListingQueryResolver } from '@modules/listing-discovery/application/public-listing-query.resolver';
import { API_OPERATIONS, API_RESPONSES } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';

import type { DiscoverListingsQueryDto } from '@modules/listing-discovery/presentation/dto/discover-listings-query.dto';
import type { SearchListingsQueryDto } from '@modules/listing-discovery/presentation/dto/search-listings-query.dto';
import { discoverListingsQuerySchema } from '@modules/listing-discovery/presentation/dto/discover-listings-query.dto';
import { searchListingsQuerySchema } from '@modules/listing-discovery/presentation/dto/search-listings-query.dto';

@ApiTags('public-listings')
@Controller('public/listings')
@AllowAnonymous()
export class PublicListingsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly listingFilters: PublicListingQueryResolver,
  ) {}

  @Get()
  @ApiOperation(API_OPERATIONS.GET_PUBLIC_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  async list(
    @Query(new ZodValidationPipe(discoverListingsQuerySchema))
    dto: DiscoverListingsQueryDto,
  ) {
    return this.runDiscover(dto);
  }

  @Get('discovery')
  @ApiOperation(API_OPERATIONS.DISCOVER_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  async discovery(
    @Query(new ZodValidationPipe(discoverListingsQuerySchema))
    dto: DiscoverListingsQueryDto,
  ) {
    return this.runDiscover(dto);
  }

  @Get('search')
  @ApiOperation(API_OPERATIONS.SEARCH_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Search results'))
  async search(
    @Query(new ZodValidationPipe(searchListingsQuerySchema))
    dto: SearchListingsQueryDto,
  ) {
    const resolved = await this.listingFilters.resolve({
      city: dto.city,
      areaIds: dto.areaIds,
      includeLocations: dto.includeLocations,
      excludeLocations: dto.excludeLocations,
      propertyCategory: dto.propertyCategory,
      propertySubtype: dto.propertySubtype,
      propertySubtypeId: dto.propertySubtypeId,
      minAreaSqyd: dto.minAreaSqyd,
      maxAreaSqyd: dto.maxAreaSqyd,
      minAreaSqft: dto.minAreaSqft,
      maxAreaSqft: dto.maxAreaSqft,
    });

    if (resolved.impossible) {
      return {
        items: [],
        page: dto.page,
        perPage: dto.perPage,
        total: 0,
      };
    }

    const result = await this.queryBus.execute(
      new SearchListingsQuery({
        q: dto.q,
        city: dto.city,
        areaIds: resolved.areaIds,
        excludeAreaIds: resolved.excludeAreaIds,
        purpose: dto.purpose as any,
        propertyCategory: dto.propertyCategory as any,
        propertySubtypeId: resolved.propertySubtypeId,
        minAreaSqft: resolved.minAreaSqft,
        maxAreaSqft: resolved.maxAreaSqft,
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

  private async runDiscover(dto: DiscoverListingsQueryDto) {
    const resolved = await this.listingFilters.resolve({
      city: dto.city,
      areaIds: dto.areaIds,
      includeLocations: dto.includeLocations,
      excludeLocations: dto.excludeLocations,
      propertyCategory: dto.propertyCategory,
      propertySubtype: dto.propertySubtype,
      propertySubtypeId: dto.propertySubtypeId,
      minAreaSqyd: dto.minAreaSqyd,
      maxAreaSqyd: dto.maxAreaSqyd,
      minAreaSqft: dto.minAreaSqft,
      maxAreaSqft: dto.maxAreaSqft,
    });

    if (resolved.impossible) {
      return {
        items: [],
        page: dto.page,
        perPage: dto.perPage,
        total: 0,
      };
    }

    const result = await this.queryBus.execute(
      new DiscoverListingsQuery({
        city: dto.city,
        page: dto.page,
        perPage: dto.perPage,
        sort: dto.sort,
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
        purpose: dto.purpose as any,
        propertyCategory: dto.propertyCategory as any,
        propertySubtypeId: resolved.propertySubtypeId,
        areaIds: resolved.areaIds,
        excludeAreaIds: resolved.excludeAreaIds,
        minAreaSqft: resolved.minAreaSqft,
        maxAreaSqft: resolved.maxAreaSqft,
        bedroomsCount: dto.bedroomsCount,
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
