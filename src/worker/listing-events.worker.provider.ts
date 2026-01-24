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
    const indexer = new ListingsIndexer(
      typesense as any,
      env.TYPESENSE_COLLECTION_LISTINGS,
    );

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
          const rows = await db
            .select()
            .from(listings)
            .where(eq(listings.id, listingId))
            .limit(1);

          const row: any = rows[0];
          if (!row) {
            // Nothing to index; treat as no-op.
            return { ok: true, skipped: true };
          }

          await indexer.upsert({
            id: String(row.id),
            title: String(row.title),
            description: row.description ?? null,
            status: String(row.status ?? 'DRAFT'),
            propertyType: row.propertyType ?? null,
            currency: String(row.currency ?? 'PKR'),
            priceAmount: Number(row.priceAmount ?? 0),
            createdAt: Math.floor(
              new Date(row.createdAt ?? new Date()).getTime() / 1000,
            ),
          });

          return { ok: true };
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
