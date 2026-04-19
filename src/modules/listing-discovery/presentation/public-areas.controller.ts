import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { and, asc, eq, ilike } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { DI } from '@app/di.tokens';
import { areas } from '@infra/db/drizzle/schema';
import type { ListPublicAreasQueryDto } from '@modules/listing-discovery/presentation/dto/list-public-areas-query.dto';
import { listPublicAreasQuerySchema } from '@modules/listing-discovery/presentation/dto/list-public-areas-query.dto';
import { API_OPERATIONS, API_RESPONSES } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';

@ApiTags('public-areas')
@Controller('public/areas')
@AllowAnonymous()
export class PublicAreasController {
  constructor(@Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>) {}

  @Get()
  @ApiOperation(API_OPERATIONS.GET_PUBLIC_AREAS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Areas'))
  async list(@Query(new ZodValidationPipe(listPublicAreasQuerySchema)) dto: ListPublicAreasQueryDto) {
    const queryText = dto.q?.trim();
    const whereExpr = and(
      eq(areas.city, dto.city),
      eq(areas.isActive, true),
      queryText ? ilike(areas.name, `%${queryText}%`) : undefined,
    );

    const rows = await this.db
      .select({
        id: areas.id,
        name: areas.name,
        city: areas.city,
      })
      .from(areas)
      .where(whereExpr)
      .orderBy(asc(areas.name))
      .limit(dto.limit);

    return {
      items: rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        city: String(row.city),
      })),
      total: rows.length,
      city: dto.city,
      q: queryText ?? '',
    };
  }
}
