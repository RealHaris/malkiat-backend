import type { ListingDomainEvent } from '../../domain/listing.aggregate';

export interface ListingEventsPublisher {
  publish(events: ListingDomainEvent[]): Promise<void>;
}
