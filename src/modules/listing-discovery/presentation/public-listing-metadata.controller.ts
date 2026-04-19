import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { and, asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { DI } from '@app/di.tokens';
import { amenities, propertySubtypes } from '@infra/db/drizzle/schema';
import {
  API_OPERATIONS,
  API_RESPONSES,
} from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import {
  listPublicPropertySubtypesQuerySchema,
  type ListPublicPropertySubtypesQueryDto,
} from './dto/list-public-property-subtypes-query.dto';

@ApiTags('public-listing-metadata')
@Controller('public/listing-metadata')
@AllowAnonymous()
export class PublicListingMetadataController {
  constructor(@Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>) {}

  @Get('property-subtypes')
  @ApiOperation(API_OPERATIONS.GET_PUBLIC_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Property subtypes'))
  async listPropertySubtypes(
    @Query(new ZodValidationPipe(listPublicPropertySubtypesQuerySchema))
    dto: ListPublicPropertySubtypesQueryDto,
  ) {
    const rows = await this.db
      .select({
        id: propertySubtypes.id,
        category: propertySubtypes.category,
        slug: propertySubtypes.slug,
        name: propertySubtypes.name,
      })
      .from(propertySubtypes)
      .where(and(eq(propertySubtypes.isActive, true), dto.category ? eq(propertySubtypes.category, dto.category) : undefined))
      .orderBy(asc(propertySubtypes.name));

    return {
      items: rows.map((row) => ({
        id: String(row.id),
        category: row.category,
        slug: String(row.slug),
        name: String(row.name),
      })),
      total: rows.length,
    };
  }

  @Get('amenities')
  @ApiOperation(API_OPERATIONS.GET_PUBLIC_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Amenities'))
  async listAmenities() {
    const rows = await this.db
      .select({
        id: amenities.id,
        slug: amenities.slug,
        name: amenities.name,
        category: amenities.category,
        subcategory: amenities.subcategory,
        valueType: amenities.valueType,
        valueOptions: amenities.valueOptions,
      })
      .from(amenities)
      .where(eq(amenities.isActive, true))
      .orderBy(asc(amenities.name));

    return {
      items: rows.map((row) => ({
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name),
        category: String(row.category),
        subcategory: row.subcategory ? String(row.subcategory) : null,
        valueType: row.valueType,
        valueOptions: (row.valueOptions as string[] | null) ?? [],
      })),
      total: rows.length,
    };
  }
}
