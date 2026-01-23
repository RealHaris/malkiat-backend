import type { ListingStatus } from './listing-status';

export type ListingProps = {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  priceAmount: string;
  currency: string;
  propertyType?: string | null;
  status: ListingStatus;
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

  static create(
    input: Omit<ListingProps, 'status'> & { status?: ListingStatus },
  ): Listing {
    const listing = new Listing({
      ...input,
      status: input.status ?? 'DRAFT',
    });
    listing.domainEvents.push({
      type: 'ListingCreated',
      listingId: listing.props.id,
      ownerId: listing.props.ownerId,
    });
    return listing;
  }

  update(
    patch: Partial<Omit<ListingProps, 'id' | 'ownerId' | 'createdAt'>>,
  ): void {
    this.props = { ...this.props, ...patch, updatedAt: new Date() };
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
