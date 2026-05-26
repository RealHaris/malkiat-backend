import type { Listing } from '@modules/listing-management/domain/listing.aggregate';
import type { ListingStatus } from '@modules/listing-management/domain/listing-status';

export interface ListingRepository {
  create(listing: Listing): Promise<void>;
  update(listing: Listing): Promise<void>;
  findById(listingId: string): Promise<Listing | null>;
  listByOwner(input: {
    ownerId: string;
    page: number;
    perPage: number;
    q?: string;
    statuses?: ListingStatus[];
  }): Promise<{ items: Listing[]; total: number }>;
  listByAgency(input: {
    agencyId: string;
    page: number;
    perPage: number;
    q?: string;
    statuses?: ListingStatus[];
  }): Promise<{ items: Listing[]; total: number }>;
  listAll(input: {
    page: number;
    perPage: number;
    q?: string;
    statuses?: ListingStatus[];
  }): Promise<{ items: Listing[]; total: number }>;
  listPublic(input: {
    city: string;
    page: number;
    perPage: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }): Promise<{ items: Listing[]; total: number }>;
  searchPublic(input: {
    q: string;
    city: string;
    areaId?: string;
    page: number;
    perPage: number;
    sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ items: Listing[]; total: number }>;
  deleteById(listingId: string): Promise<void>;
}
