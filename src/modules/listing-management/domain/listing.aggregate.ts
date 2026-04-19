import type { ListingStatus } from './listing-status';

export type ListingProps = {
  id: string;
  createdByUserId?: string;
  ownerId: string;
  agencyId?: string | null;
  title: string;
  description?: string | null;
  purpose: 'SELL' | 'RENT';
  propertyCategory: 'HOME' | 'PLOT' | 'COMMERCIAL';
  propertySubtypeId: string;
  city: string;
  areaId: string;
  locationText: string;
  latitude?: string | null;
  longitude?: string | null;
  areaValue: string;
  areaUnit: 'MARLA' | 'SQFT' | 'SQYD' | 'KANAL';
  areaSqft: string;
  priceAmount: string;
  currency: 'PKR';
  installmentAvailable: boolean;
  readyForPossession: boolean;
  bedroomsCount?: number | null;
  bathroomsCount?: number | null;
  imagesJson: string[];
  videoUrl?: string | null;
  platforms: string[];
  amenityIds?: string[];
  amenityValues?: Record<string, string | number | boolean>;
  status: ListingStatus;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ListingDomainEvent =
  | { type: 'ListingCreated'; listingId: string; ownerId: string }
  | { type: 'ListingUpdated'; listingId: string; ownerId: string }
  | { type: 'ListingDeleted'; listingId: string; ownerId: string };

export class Listing {
  private domainEvents: ListingDomainEvent[] = [];

  private constructor(private props: ListingProps) {}

  static rehydrate(input: ListingProps): Listing {
    return new Listing({
      ...input,
      createdByUserId: input.createdByUserId ?? input.ownerId,
    });
  }

  static create(input: Omit<ListingProps, 'status'> & { status?: ListingStatus }): Listing {
    const listing = new Listing({
      ...input,
      createdByUserId: input.createdByUserId ?? input.ownerId,
      status: input.status ?? 'DRAFT',
    });
    listing.domainEvents.push({
      type: 'ListingCreated',
      listingId: listing.props.id,
      ownerId: listing.props.ownerId,
    });
    return listing;
  }

  update(patch: Partial<Omit<ListingProps, 'id' | 'createdByUserId' | 'ownerId' | 'createdAt'>>): void {
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<Omit<ListingProps, 'id' | 'createdByUserId' | 'ownerId' | 'createdAt'>>;

    this.props = { ...this.props, ...cleanPatch, updatedAt: new Date() };
    this.domainEvents.push({
      type: 'ListingUpdated',
      listingId: this.props.id,
      ownerId: this.props.ownerId,
    });
  }

  markDeleted(): void {
    this.domainEvents.push({
      type: 'ListingDeleted',
      listingId: this.props.id,
      ownerId: this.props.ownerId,
    });
  }

  pullDomainEvents(): ListingDomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  get snapshot(): ListingProps {
    return { ...this.props };
  }
}
