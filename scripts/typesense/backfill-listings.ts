require('dotenv').config();

const postgres = require('postgres');
const { Client } = require('typesense');

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function toUnixSeconds(d) {
  return Math.floor(new Date(d).getTime() / 1000);
}

async function main() {
  const databaseUrl = required('DATABASE_URL');

  const host = required('TYPESENSE_HOST');
  const port = Number(required('TYPESENSE_PORT'));
  const protocol = required('TYPESENSE_PROTOCOL');
  const apiKey = required('TYPESENSE_ADMIN_API_KEY');
  const indexName = process.env.TYPESENSE_COLLECTION_LISTINGS || 'listings';

  const typesense = new Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    retryIntervalSeconds: 5,
    connectionTimeoutSeconds: 60,
  });

  const sql = postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
  });

  const batchSize = Number(process.env.TYPESENSE_BACKFILL_BATCH_SIZE || 500);

  let offset = 0;
  let total = 0;

  for (;;) {
    const rows = await sql`
      select
        id,
        owner_id as "ownerId",
        title,
        description,
        purpose,
        status,
        condition,
        bedrooms_count as "bedroomsCount",
        bathrooms_count as "bathroomsCount",
        availability,
        property_category as "propertyCategory",
        property_subtype_id as "propertySubtypeId",
        city,
        area_id as "areaId",
        location_text as "locationText",
        google_maps_url as "googleMapsUrl",
        area_value as "areaValue",
        area_unit as "areaUnit",
        area_sqft as "areaSqft",
        currency,
        price_amount as "priceAmount",
        installment_available as "installmentAvailable",
        ready_for_possession as "readyForPossession",
        images_json as "imagesJson",
        video_url as "videoUrl",
        platforms,
        published_at as "publishedAt",
        created_at as "createdAt"
      from listings
      order by created_at asc
      limit ${batchSize} offset ${offset}
    `;

    if (!rows.length) break;

    const ndjson = rows
      .map((r) =>
        JSON.stringify({
          id: String(r.id),
          ownerId: String(r.ownerId),
          title: String(r.title ?? ''),
          description: r.description ?? undefined,
          purpose: String(r.purpose),
          status: String(r.status ?? 'DRAFT'),
          condition: r.condition ?? undefined,
          bedroomsCount: r.bedroomsCount ? Number(r.bedroomsCount) : undefined,
          bathroomsCount: r.bathroomsCount ? Number(r.bathroomsCount) : undefined,
          availabilityDays: Array.isArray(r.availability?.days)
            ? r.availability.days.map((d) => String(d))
            : undefined,
          propertyCategory: r.propertyCategory ?? undefined,
          propertySubtypeId: r.propertySubtypeId ? String(r.propertySubtypeId) : undefined,
          city: r.city ?? undefined,
          areaId: r.areaId ? String(r.areaId) : undefined,
          locationText: r.locationText ?? undefined,
          googleMapsUrl: r.googleMapsUrl ?? undefined,
          areaValue: Number(r.areaValue ?? 0),
          areaUnit: String(r.areaUnit),
          areaSqft:
            typeof r.areaSqft === 'undefined' || r.areaSqft === null
              ? undefined
              : Number(r.areaSqft),
          currency: String(r.currency ?? 'PKR'),
          priceAmount: Number(r.priceAmount ?? 0),
          installmentAvailable: Boolean(r.installmentAvailable),
          readyForPossession: Boolean(r.readyForPossession),
          imagesJson: Array.isArray(r.imagesJson) ? r.imagesJson.map(String) : [],
          videoUrl: r.videoUrl ?? undefined,
          platforms: Array.isArray(r.platforms) ? r.platforms.map(String) : [],
          publishedAt: r.publishedAt ? toUnixSeconds(r.publishedAt) : undefined,
          createdAt: toUnixSeconds(r.createdAt ?? new Date()),
        }),
      )
      .join('\n');

    const resultsInJSONLFormat = await typesense
      .collections(indexName)
      .documents()
      .import(ndjson, { action: 'upsert', dirty_values: 'coerce_or_reject' });

    const failed = String(resultsInJSONLFormat)
      .split('\n')
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter((x) => x && x.success === false);

    if (failed.length) {
      console.warn('Some documents failed to import:', failed.slice(0, 5));
    }

    offset += rows.length;
    total += rows.length;
    console.log(`Backfilled ${total} listings...`);
  }

  await sql.end({ timeout: 5 });
  console.log(`Done. Backfilled ${total} listings into ${indexName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
