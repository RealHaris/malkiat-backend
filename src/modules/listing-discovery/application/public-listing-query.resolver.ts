import { Inject, Injectable } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DI } from '@app/di.tokens';
import { areas, propertySubtypes } from '@infra/db/drizzle/schema';

const SQYD_TO_SQFT = 9;

export type ResolvePublicListingFiltersInput = {
  city: string;
  /** Canonical UUIDs from API clients */
  areaIds?: string[];
  /** Area display names (matches frontend `includeLocations`) */
  includeLocations?: string[];
  excludeLocations?: string[];
  propertyCategory?: 'HOME' | 'PLOT' | 'COMMERCIAL';
  /** Display label (matches frontend `propertySubtype`, e.g. "House") */
  propertySubtype?: string;
  propertySubtypeId?: string;
  minAreaSqyd?: number;
  maxAreaSqyd?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
};

export type ResolvePublicListingFiltersResult = {
  /** When true, no listing should match (caller should short-circuit). */
  impossible: boolean;
  areaIds?: string[];
  excludeAreaIds?: string[];
  propertySubtypeId?: string;
  minAreaSqft?: number;
  maxAreaSqft?: number;
};

@Injectable()
export class PublicListingQueryResolver {
  constructor(@Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>) {}

  async resolve(input: ResolvePublicListingFiltersInput): Promise<ResolvePublicListingFiltersResult> {
    const explicitAreaIds = uniqueIds(input.areaIds);
    const includeNames = normalizeNames(input.includeLocations);
    const excludeNames = normalizeNames(input.excludeLocations);

    const [fromIncludeNames, excludeIds, propertySubtypeId] = await Promise.all([
      includeNames.length ? this.lookupAreaIdsByNames(input.city, includeNames) : Promise.resolve([]),
      excludeNames.length ? this.lookupAreaIdsByNames(input.city, excludeNames) : Promise.resolve([]),
      this.resolveSubtypeId(input),
    ]);

    const mergedAreaIds = uniqueIds([...explicitAreaIds, ...fromIncludeNames]);

    const includeRequested = includeNames.length > 0;
    const noAreaMatch = includeRequested && fromIncludeNames.length === 0 && explicitAreaIds.length === 0;

    const subtypeLabel = input.propertySubtype?.trim();
    const subtypeRequested = Boolean(subtypeLabel && input.propertyCategory);
    const noSubtypeMatch = subtypeRequested && !propertySubtypeId;

    const minAreaSqft =
      typeof input.minAreaSqft === 'number'
        ? input.minAreaSqft
        : typeof input.minAreaSqyd === 'number'
          ? input.minAreaSqyd * SQYD_TO_SQFT
          : undefined;
    const maxAreaSqft =
      typeof input.maxAreaSqft === 'number'
        ? input.maxAreaSqft
        : typeof input.maxAreaSqyd === 'number'
          ? input.maxAreaSqyd * SQYD_TO_SQFT
          : undefined;

    return {
      impossible: noAreaMatch || noSubtypeMatch,
      areaIds: mergedAreaIds.length ? mergedAreaIds : undefined,
      excludeAreaIds: excludeIds.length ? excludeIds : undefined,
      propertySubtypeId,
      minAreaSqft,
      maxAreaSqft,
    };
  }

  private async lookupAreaIdsByNames(city: string, names: string[]): Promise<string[]> {
    if (!names.length) return [];
    const nameExprs = names.map((n) => sql`lower(trim(${areas.name})) = ${n.toLowerCase()}`);
    const rows = await this.db
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.city, city), eq(areas.isActive, true), or(...nameExprs)));
    return uniqueIds(rows.map((r) => String(r.id)));
  }

  private async resolveSubtypeId(input: ResolvePublicListingFiltersInput): Promise<string | undefined> {
    if (input.propertySubtypeId?.trim()) return input.propertySubtypeId.trim();
    const label = input.propertySubtype?.trim();
    if (!label || !input.propertyCategory) return undefined;

    const rows = await this.db
      .select({ id: propertySubtypes.id })
      .from(propertySubtypes)
      .where(
        and(
          eq(propertySubtypes.category, input.propertyCategory),
          eq(propertySubtypes.isActive, true),
          sql`lower(trim(${propertySubtypes.name})) = ${label.toLowerCase()}`,
        ),
      )
      .limit(2);

    if (rows.length !== 1) return undefined;
    return String(rows[0].id);
  }
}

function normalizeNames(raw?: string[]): string[] {
  if (!raw?.length) return [];
  return [...new Set(raw.map((s) => s.trim()).filter(Boolean))];
}

function uniqueIds(ids?: string[]): string[] {
  return [...new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))];
}
