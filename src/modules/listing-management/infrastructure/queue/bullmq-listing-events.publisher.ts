import type { Queue } from 'bullmq';

import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import type { ListingDomainEvent } from '@modules/listing-management/domain/listing.aggregate';

export class BullmqListingEventsPublisher implements ListingEventsPublisher {
  constructor(private readonly queue: Queue) {}

  async publish(events: ListingDomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const jobs = events.map((e) => ({
      name: e.type,
      data: e,
      opts: {
        jobId: `${e.type}:${e.listingId}:${Date.now()}`,
      },
    }));

    await this.queue.addBulk(jobs);
  }
}
