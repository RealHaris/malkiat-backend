import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';

import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { Listing } from '@modules/listing-management/domain/listing.aggregate';
import { listings, listingAmenities } from '@infra/db/drizzle/schema';
import { Listing as ListingAggregate } from '@modules/listing-management/domain/listing.aggregate';

export class DrizzleListingRepository implements ListingRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  private toAggregate(row: any, amenityIds: string[] = []): Listing {
    return ListingAggregate.rehydrate({
      id: String(row.id),
      createdByUserId: String(row.createdByUserId ?? row.ownerId),
      ownerId: String(row.ownerId),
      agencyId: row.agencyId ? String(row.agencyId) : null,
      title: String(row.title),
      description: row.description ?? null,
      purpose: row.purpose,
      propertyCategory: row.propertyCategory,
      propertySubtypeId: String(row.propertySubtypeId),
      city: String(row.city),
      areaId: String(row.areaId),
      locationText: String(row.locationText),
      latitude: row.latitude ? String(row.latitude) : null,
      longitude: row.longitude ? String(row.longitude) : null,
      areaValue: String(row.areaValue),
      areaUnit: row.areaUnit,
      areaSqft: String(row.areaSqft),
      priceAmount: String(row.priceAmount),
      currency: row.currency,
      installmentAvailable: Boolean(row.installmentAvailable),
      readyForPossession: Boolean(row.readyForPossession),
      bedroomsCount: row.bedroomsCount ?? null,
      bathroomsCount: row.bathroomsCount ?? null,
      imagesJson: (row.imagesJson as string[] | null) ?? [],
      videoUrl: row.videoUrl ?? null,
      platforms: ((row.platforms as string[] | null) ?? ['ZAMEEN']) as string[],
      amenityIds,
      status: row.status,
      publishedAt: row.publishedAt ?? null,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    });
  }

  async create(listing: Listing): Promise<void> {
    const s = listing.snapshot;
    const createdByUserId = s.createdByUserId ?? s.ownerId;

    await this.db.insert(listings).values({
      id: s.id,
      createdByUserId,
      ownerId: s.ownerId,
      agencyId: s.agencyId ?? null,
      title: s.title,
      description: s.description ?? null,
      purpose: s.purpose,
      propertyCategory: s.propertyCategory,
      propertySubtypeId: s.propertySubtypeId,
      city: s.city,
      countryCode: 'PK',
      areaId: s.areaId,
      locationText: s.locationText,
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      areaValue: s.areaValue,
      areaUnit: s.areaUnit,
      areaSqft: s.areaSqft,
      priceAmount: s.priceAmount,
      currency: s.currency,
      installmentAvailable: s.installmentAvailable,
      readyForPossession: s.readyForPossession,
      bedroomsCount: s.bedroomsCount ?? null,
      bathroomsCount: s.bathroomsCount ?? null,
      imagesJson: s.imagesJson,
      videoUrl: s.videoUrl ?? null,
      platforms: s.platforms as any,
      status: s.status,
      publishedAt: s.publishedAt ?? null,
    });

    if (s.amenityIds && s.amenityIds.length > 0) {
      await this.db.insert(listingAmenities).values(
        s.amenityIds.map((amenityId) => ({
          listingId: s.id,
          amenityId,
        })),
      );
    }
  }

  async update(listing: Listing): Promise<void> {
    const s = listing.snapshot;
    await this.db
      .update(listings)
      .set({
        title: s.title,
        agencyId: s.agencyId ?? null,
        description: s.description ?? null,
        purpose: s.purpose,
        propertyCategory: s.propertyCategory,
        propertySubtypeId: s.propertySubtypeId,
        city: s.city,
        areaId: s.areaId,
        locationText: s.locationText,
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        areaValue: s.areaValue,
        areaUnit: s.areaUnit,
        areaSqft: s.areaSqft,
        priceAmount: s.priceAmount,
        currency: s.currency,
        installmentAvailable: s.installmentAvailable,
        readyForPossession: s.readyForPossession,
        bedroomsCount: s.bedroomsCount ?? null,
        bathroomsCount: s.bathroomsCount ?? null,
        imagesJson: s.imagesJson,
        videoUrl: s.videoUrl ?? null,
        platforms: s.platforms as any,
        status: s.status,
        publishedAt: s.publishedAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, s.id));

    await this.db.delete(listingAmenities).where(eq(listingAmenities.listingId, s.id));
    if (s.amenityIds && s.amenityIds.length > 0) {
      await this.db.insert(listingAmenities).values(
        s.amenityIds.map((amenityId) => ({
          listingId: s.id,
          amenityId,
        })),
      );
    }
  }

  async findById(listingId: string): Promise<Listing | null> {
    const rows = await this.db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    const row = rows[0];
    if (!row) return null;

    const amenityRows = await this.db
      .select({ amenityId: listingAmenities.amenityId })
      .from(listingAmenities)
      .where(eq(listingAmenities.listingId, listingId));

    return this.toAggregate(row, amenityRows.map((x) => String(x.amenityId)));
  }

  async listByOwner(input: {
    ownerId: string;
    page: number;
    perPage: number;
  }): Promise<{ items: Listing[]; total: number }> {
    const offset = (input.page - 1) * input.perPage;
    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(listings)
        .where(eq(listings.ownerId, input.ownerId))
        .orderBy(desc(listings.createdAt))
        .limit(input.perPage)
        .offset(offset),
      this.db.select({ total: count() }).from(listings).where(eq(listings.ownerId, input.ownerId)),
    ]);

    const items = rows.map((row) => this.toAggregate(row));

    return { items, total: Number(totals[0]?.total ?? 0) };
  }

  async listPublic(input: {
    city: string;
    page: number;
    perPage: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }): Promise<{ items: Listing[]; total: number }> {
    const offset = (input.page - 1) * input.perPage;
    const orderByClause =
      input.sort === 'price_asc'
        ? [asc(listings.priceAmount), desc(listings.createdAt)]
        : input.sort === 'price_desc'
          ? [desc(listings.priceAmount), desc(listings.createdAt)]
          : [desc(listings.createdAt)];

    const whereExpr = and(eq(listings.status, 'PUBLISHED'), eq(listings.city, input.city));

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(listings)
        .where(whereExpr)
        .orderBy(...orderByClause)
        .limit(input.perPage)
        .offset(offset),
      this.db.select({ total: count() }).from(listings).where(whereExpr),
    ]);

    const items = rows.map((row) => this.toAggregate(row));

    return { items, total: Number(totals[0]?.total ?? 0) };
  }

  async searchPublic(input: {
    q: string;
    city: string;
    areaId?: string;
    page: number;
    perPage: number;
    sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ items: Listing[]; total: number }> {
    const offset = (input.page - 1) * input.perPage;
    const orderByClause =
      input.sort === 'price_asc'
        ? [asc(listings.priceAmount), desc(listings.createdAt)]
        : input.sort === 'price_desc'
          ? [desc(listings.priceAmount), desc(listings.createdAt)]
          : [desc(listings.createdAt)];

    const whereExpr = and(
      eq(listings.status, 'PUBLISHED'),
      eq(listings.city, input.city),
      input.areaId ? eq(listings.areaId, input.areaId) : undefined,
      typeof input.minPrice === 'number' ? gte(listings.priceAmount, input.minPrice.toString()) : undefined,
      typeof input.maxPrice === 'number' ? lte(listings.priceAmount, input.maxPrice.toString()) : undefined,
      or(ilike(listings.title, `%${input.q}%`), ilike(listings.description, `%${input.q}%`)),
    );

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(listings)
        .where(whereExpr)
        .orderBy(...orderByClause)
        .limit(input.perPage)
        .offset(offset),
      this.db.select({ total: count() }).from(listings).where(whereExpr),
    ]);

    const items = rows.map((row) => this.toAggregate(row));

    return { items, total: Number(totals[0]?.total ?? 0) };
  }

  async deleteById(listingId: string): Promise<void> {
    await this.db.delete(listings).where(eq(listings.id, listingId));
  }
}
