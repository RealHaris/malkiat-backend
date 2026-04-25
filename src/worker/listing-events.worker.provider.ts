import { Logger, Provider } from '@nestjs/common';
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
    const logger = new Logger('ListingEventsWorker');

    return new Worker(
      env.LISTING_EVENTS_QUEUE_NAME,
      async (job) => {
        logger.log(`Processing job: ${job.name}`);
        const eventType = String(job.name);
        const data: any = job.data;

        if (eventType === 'ListingDeleted') {
          logger.log('Listing deletion event received, removing from search index');
          await indexer.deleteById(String(data.listingId));
          logger.log('Job completed: Listing removed from search index');
          return { ok: true };
        }

        if (eventType === 'ListingCreated' || eventType === 'ListingUpdated') {
          logger.log('Listing created/updated event received, fetching data');
          const listingId = String(data.listingId);
          const rows = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);

          const row: any = rows[0];
          if (!row) {
            logger.warn('Listing data not found, skipping indexing');
            return { ok: true, skipped: true };
          }

          const currentStatus = String(row.status ?? 'DRAFT');

          if (currentStatus === 'DELETED') {
            logger.log('Listing is marked as deleted, removing from search index');
            await indexer.deleteById(String(row.id));
            logger.log('Job completed: Listing removed from search index');
            return { ok: true };
          }

          if (currentStatus === 'PUBLISHED') {
            logger.log('Listing is published, upserting to search index');
            await indexer.upsert({
              id: String(row.id),
              ownerId: String(row.ownerId),
              title: String(row.title),
              description: row.description ?? null,
              purpose: String(row.purpose),
              status: currentStatus,
              condition: row.condition ?? null,
              bedroomsCount: row.bedroomsCount ? Number(row.bedroomsCount) : null,
              bathroomsCount: row.bathroomsCount ? Number(row.bathroomsCount) : null,
              availabilityDays: Array.isArray(row.availability?.days)
                ? row.availability.days.map((d: any) => String(d))
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
              videoUrl: row.videoUrl ?? null,
              platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
              publishedAt: row.publishedAt ? Math.floor(new Date(row.publishedAt).getTime() / 1000) : null,
              createdAt: Math.floor(new Date(row.createdAt ?? new Date()).getTime() / 1000),
            });

            logger.log('Job completed: Listing indexed successfully');
            return { ok: true };
          }

          logger.log('Listing is not published, ensuring it is removed from search index');
          await indexer.deleteById(String(row.id));
          logger.log('Job completed: Listing removed from search index');
          return { ok: true, skipped: true, reason: `Status is ${currentStatus}, not PUBLISHED` };
        }

        logger.warn(`Unknown event type ignored: ${eventType}`);
        return { ok: true, ignored: true };
      },
      {
        connection,
        concurrency: 10,
      },
    );
  },
};
