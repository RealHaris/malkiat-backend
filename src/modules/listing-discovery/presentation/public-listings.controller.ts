import { Controller, Get, Query } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

import { DiscoverListingsQuery } from "@modules/listing-discovery/application/queries/discover-listings.query";
import { SearchListingsQuery } from "@modules/listing-discovery/application/queries/search-listings.query";

@ApiTags("public-listings")
@Controller("public/listings")
@AllowAnonymous()
export class PublicListingsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("discovery")
  @ApiOperation({ summary: "Discover listings" })
  @ApiResponse({ status: 200, description: "Listings retrieved successfully" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number",
  })
  @ApiQuery({
    name: "perPage",
    required: false,
    type: Number,
    description: "Items per page",
  })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["newest", "price_asc", "price_desc"],
    description: "Sort order",
  })
  @ApiQuery({
    name: "propertyType",
    required: false,
    type: String,
    description: "Property type filter",
  })
  @ApiQuery({
    name: "currency",
    required: false,
    type: String,
    description: "Currency filter",
  })
  async discovery(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("sort") sort?: "newest" | "price_asc" | "price_desc",
    @Query("propertyType") propertyType?: string,
    @Query("currency") currency?: string,
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

  @Get("search")
  @ApiOperation({ summary: "Search listings" })
  @ApiResponse({
    status: 200,
    description: "Search results retrieved successfully",
  })
  @ApiQuery({
    name: "q",
    required: false,
    type: String,
    description: "Search query",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number",
  })
  @ApiQuery({
    name: "perPage",
    required: false,
    type: Number,
    description: "Items per page",
  })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["relevance", "newest", "price_asc", "price_desc"],
    description: "Sort order",
  })
  @ApiQuery({
    name: "propertyType",
    required: false,
    type: String,
    description: "Property type filter",
  })
  @ApiQuery({
    name: "currency",
    required: false,
    type: String,
    description: "Currency filter",
  })
  @ApiQuery({
    name: "minPrice",
    required: false,
    type: Number,
    description: "Minimum price filter",
  })
  @ApiQuery({
    name: "maxPrice",
    required: false,
    type: Number,
    description: "Maximum price filter",
  })
  async search(
    @Query("q") q = "",
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("sort") sort?: "relevance" | "newest" | "price_asc" | "price_desc",
    @Query("propertyType") propertyType?: string,
    @Query("currency") currency?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
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
