import type { ListingDomainEvent } from "@modules/listing-management/domain/listing.aggregate";

export interface ListingEventsPublisher {
  publish(events: ListingDomainEvent[]): Promise<void>;
}
