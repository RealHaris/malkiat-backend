import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import type { ListingDomainEvent } from '@modules/listing-management/domain/listing.aggregate';

export class CfEventsPublisher implements ListingEventsPublisher {
  constructor(private readonly workerUrl: string) {}

  async publish(events: ListingDomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const resp = await fetch(this.workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Failed to publish events to CF Worker (${resp.status}): ${text}`);
    }
  }
}
