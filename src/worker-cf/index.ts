/// <reference types="@cloudflare/workers-types" />
import { neon } from '@neondatabase/serverless';

interface ListingEvent {
  type: 'ListingCreated' | 'ListingUpdated' | 'ListingDeleted';
  listingId: string;
  ownerId: string;
}

interface Env {
  LISTING_QUEUE: Queue<ListingEvent>;
  DATABASE_URL: string;
  TYPESENSE_HOST: string;
  TYPESENSE_PORT: string;
  TYPESENSE_PROTOCOL: string;
  TYPESENSE_ADMIN_API_KEY: string;
  TYPESENSE_COLLECTION_LISTINGS: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'POST') {
      try {
        const events: ListingEvent[] = await req.json();
        if (!Array.isArray(events)) {
          return new Response('Expected array of events', { status: 400 });
        }
        const sendPromises = events.map((event) => env.LISTING_QUEUE.send(event));
        await Promise.all(sendPromises);
        return new Response('OK', { status: 202 });
      } catch (err) {
        return new Response(String(err), { status: 500 });
      }
    }
    return new Response('Not Found', { status: 404 });
  },

  async queue(batch: MessageBatch<ListingEvent>, env: Env): Promise<void> {
    const sql = neon(env.DATABASE_URL);
    const collection = env.TYPESENSE_COLLECTION_LISTINGS;
    const protocol = env.TYPESENSE_PROTOCOL || 'http';
    const host = env.TYPESENSE_HOST || 'localhost';
    const port = env.TYPESENSE_PORT || '8108';
    const apiKey = env.TYPESENSE_ADMIN_API_KEY;
    const baseUrl = `${protocol}://${host}:${port}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-TYPESENSE-API-KEY': apiKey,
    };

    for (const msg of batch.messages) {
      const event = msg.body;
      console.log(`Processing event: ${event.type} for listing ${event.listingId}`);

      try {
        if (event.type === 'ListingDeleted') {
          await deleteFromTypesense(baseUrl, collection, event.listingId, headers);
          console.log(`Deleted listing ${event.listingId} from search index`);
          msg.ack();
          continue;
        }

        if (event.type === 'ListingCreated' || event.type === 'ListingUpdated') {
          const rows = await sql`
            SELECT * FROM listings WHERE id = ${event.listingId} LIMIT 1
          `;

          const row: any = rows?.[0];
          if (!row) {
            console.warn(`Listing ${event.listingId} not found, skipping`);
            msg.ack();
            continue;
          }

          const currentStatus = String(row.status ?? 'DRAFT');

          if (currentStatus === 'DELETED') {
            await deleteFromTypesense(baseUrl, collection, String(row.id), headers);
            console.log(`Listing ${row.id} is deleted, removed from search index`);
            msg.ack();
            continue;
          }

          if (currentStatus === 'PUBLISHED') {
            const doc = {
              id: String(row.id),
              ownerId: String(row.ownerId),
              title: String(row.title),
              description: row.description ?? null,
              purpose: String(row.purpose),
              status: currentStatus,
              condition: row.condition ?? null,
              bedroomsCount: row.bedroomsCount ? Number(row.bedroomsCount) : null,
              bathroomsCount: row.bathroomsCount ? Number(row.bathroomsCount) : null,
              availabilityDays: row.availability?.days
                ? (row.availability as any).days.map((d: any) => String(d))
                : undefined,
              propertyCategory: row.propertyCategory ?? null,
              propertySubtypeId: row.propertySubtypeId ? String(row.propertySubtypeId) : null,
              city: row.city ? String(row.city) : null,
              areaId: row.areaId ? String(row.areaId) : null,
              locationText: row.locationText ? String(row.locationText) : null,
              googleMapsUrl: row.googleMapsUrl ? String(row.googleMapsUrl) : null,
              areaValue: Number(row.areaValue ?? 0),
              areaUnit: String(row.areaUnit ?? 'MARLA'),
              areaSqft: Number(row.areaSqft ?? 0),
              currency: String(row.currency ?? 'PKR'),
              priceAmount: Number(row.priceAmount ?? 0),
              installmentAvailable: Boolean(row.installmentAvailable),
              readyForPossession: Boolean(row.readyForPossession),
              imagesJson: Array.isArray(row.imagesJson) ? row.imagesJson.map(String) : [],
              phoneNumbers: Array.isArray(row.phoneNumbers) ? row.phoneNumbers.map(String) : [],
              videoUrl: row.videoUrl ?? null,
              platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
              publishedAt: row.publishedAt ? Math.floor(new Date(row.publishedAt).getTime() / 1000) : null,
              createdAt: Math.floor(new Date(row.createdAt ?? new Date()).getTime() / 1000),
            };

            await upsertToTypesense(baseUrl, collection, doc, headers);
            console.log(`Indexed listing ${row.id} successfully`);
          } else {
            await deleteFromTypesense(baseUrl, collection, String(row.id), headers);
            console.log(`Listing ${row.id} is ${currentStatus}, removed from search index`);
          }

          msg.ack();
        }
      } catch (err) {
        console.error(`Failed to process event ${event.type} for ${event.listingId}:`, err);
        msg.retry();
      }
    }
  },
};

async function upsertToTypesense(baseUrl: string, collection: string, doc: any, headers: Record<string, string>) {
  const resp = await fetch(`${baseUrl}/collections/${collection}/documents/upsert`, {
    method: 'POST',
    headers,
    body: JSON.stringify(doc),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Typesense upsert failed (${resp.status}): ${text}`);
  }
}

async function deleteFromTypesense(baseUrl: string, collection: string, id: string, headers: Record<string, string>) {
  const resp = await fetch(`${baseUrl}/collections/${collection}/documents/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (resp.status !== 404 && !resp.ok) {
    const text = await resp.text();
    throw new Error(`Typesense delete failed (${resp.status}): ${text}`);
  }
}
