import { Provider } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import type { TypesenseClient } from '@infra/typesense/provider';
import { listings } from '@infra/db/drizzle/schema';

import { ListingsIndexer } from './typesense/listings.indexer';

export const ListingEventsWorkerProvider: Provider = {
  provide: 'ListingEventsWorker',
  inject: [APP_ENV, DI.BullmqConnection, DI.DrizzleDb, DI.TypesenseClient],
  useFactory: (
    env: AppEnv,
    connection: ConnectionOptions,
    db: PostgresJsDatabase<any>,
    typesense: TypesenseClient,
  ) => {
    const indexer = new ListingsIndexer(typesense as any, env.TYPESENSE_COLLECTION_LISTINGS);

    return new Worker(
      env.LISTING_EVENTS_QUEUE_NAME,
      async (job) => {
        const eventType = String(job.name);
        const data: any = job.data;

        if (eventType === 'ListingDeleted') {
          await indexer.deleteById(String(data.listingId));
          return { ok: true };
        }

        if (eventType === 'ListingCreated' || eventType === 'ListingUpdated') {
          const listingId = String(data.listingId);
          const rows = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);

          const row: any = rows[0];
          if (!row) {
            // Nothing to index; treat as no-op.
            return { ok: true, skipped: true };
          }

          const currentStatus = String(row.status ?? 'DRAFT');

          if (currentStatus === 'DELETED') {
            await indexer.deleteById(String(row.id));
            return { ok: true };
          }

          if (currentStatus === 'PUBLISHED') {
            await indexer.upsert({
              id: String(row.id),
              title: String(row.title),
              description: row.description ?? null,
              purpose: String(row.purpose),
              status: currentStatus,
              condition: row.condition ?? null,
              bedroomsCount: row.bedroomsCount ? Number(row.bedroomsCount) : null,
              availabilityDays: Array.isArray(row.availability?.days)
                ? row.availability.days.map((d: any) => String(d))
                : undefined,
              propertyCategory: row.propertyCategory ?? null,
              propertySubtypeId: row.propertySubtypeId ? String(row.propertySubtypeId) : null,
              city: row.city ? String(row.city) : null,
              areaId: row.areaId ? String(row.areaId) : null,
              locationText: row.locationText ? String(row.locationText) : null,
              areaSqft: Number(row.areaSqft ?? 0),
              currency: String(row.currency ?? 'PKR'),
              priceAmount: Number(row.priceAmount ?? 0),
              createdAt: Math.floor(new Date(row.createdAt ?? new Date()).getTime() / 1000),
            });

            return { ok: true };
          }

          // If the status is not PUBLISHED (e.g. DRAFT, ARCHIVED),
          // ensure it is removed from Typesense so it does not appear in search.
          await indexer.deleteById(String(row.id));
          return { ok: true, skipped: true, reason: `Status is ${currentStatus}, not PUBLISHED` };
        }

        return { ok: true, ignored: true };
      },
      {
        connection,
        concurrency: 10,
      },
    );
  },
};
