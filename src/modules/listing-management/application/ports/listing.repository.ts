import type { Listing } from '../../domain/listing.aggregate';

export interface ListingRepository {
  create(listing: Listing): Promise<void>;
  update(listing: Listing): Promise<void>;
  deleteById(listingId: string): Promise<void>;
}
