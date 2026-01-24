import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

import type { ListingRepository } from "@modules/listing-management/application/ports/listing.repository";
import type { Listing } from "@modules/listing-management/domain/listing.aggregate";
import { listings } from "@infra/db/drizzle/schema";

export class DrizzleListingRepository implements ListingRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async create(listing: Listing): Promise<void> {
    const s = listing.snapshot;
    await this.db.insert(listings).values({
      id: s.id,
      ownerId: s.ownerId,
      title: s.title,
      description: s.description ?? null,
      priceAmount: s.priceAmount,
      currency: s.currency,
      propertyType: s.propertyType ?? null,
      status: s.status,
    });
  }

  async update(listing: Listing): Promise<void> {
    const s = listing.snapshot;
    await this.db
      .update(listings)
      .set({
        title: s.title,
        description: s.description ?? null,
        priceAmount: s.priceAmount,
        currency: s.currency,
        propertyType: s.propertyType ?? null,
        status: s.status,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, s.id));
  }

  async deleteById(listingId: string): Promise<void> {
    await this.db.delete(listings).where(eq(listings.id, listingId));
  }
}
