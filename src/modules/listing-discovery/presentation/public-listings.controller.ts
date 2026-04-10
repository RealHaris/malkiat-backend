import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { API_OPERATIONS, API_RESPONSES } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';

import { DiscoverListingsQuery } from '@modules/listing-discovery/application/queries/discover-listings.query';
import { SearchListingsQuery } from '@modules/listing-discovery/application/queries/search-listings.query';
import type { DiscoverListingsQueryDto } from '@modules/listing-discovery/presentation/dto/discover-listings-query.dto';
import type { SearchListingsQueryDto } from '@modules/listing-discovery/presentation/dto/search-listings-query.dto';
import { discoverListingsQuerySchema } from '@modules/listing-discovery/presentation/dto/discover-listings-query.dto';
import { searchListingsQuerySchema } from '@modules/listing-discovery/presentation/dto/search-listings-query.dto';

@ApiTags('public-listings')
@Controller('public/listings')
@AllowAnonymous()
export class PublicListingsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('discovery')
  @ApiOperation(API_OPERATIONS.DISCOVER_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  async discovery(
    @Query(new ZodValidationPipe(discoverListingsQuerySchema))
    dto: DiscoverListingsQueryDto,
  ) {
    return this.queryBus.execute(new DiscoverListingsQuery(dto));
  }

  @Get('search')
  @ApiOperation(API_OPERATIONS.SEARCH_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Search results'))
  async search(
    @Query(new ZodValidationPipe(searchListingsQuerySchema))
    dto: SearchListingsQueryDto,
  ) {
    return this.queryBus.execute(new SearchListingsQuery(dto));
  }
}
