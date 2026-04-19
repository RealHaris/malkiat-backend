import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { user } from './better-auth';
import { agencies } from './agencies';

export const listingStatusEnum = pgEnum('listing_status', [
  'DRAFT',
  'UNDER_REVIEW',
  'PUBLISHED',
  'ARCHIVED',
]);
export const listingPurposeEnum = pgEnum('listing_purpose', ['SELL', 'RENT']);
export const propertyCategoryEnum = pgEnum('property_category', ['HOME', 'PLOT', 'COMMERCIAL']);
export const areaUnitEnum = pgEnum('area_unit', ['MARLA', 'SQFT', 'SQYD', 'KANAL']);
export const currencyEnum = pgEnum('listing_currency', ['PKR']);
export const platformEnum = pgEnum('listing_platform', ['ZAMEEN']);
export const amenityValueTypeEnum = pgEnum('amenity_value_type', ['boolean', 'text', 'number', 'select']);

export const propertySubtypes = pgTable(
  'property_subtypes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category: propertyCategoryEnum('category').notNull(),
    slug: varchar('slug', { length: 64 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('property_subtypes_category_slug_uk').on(table.category, table.slug)],
);

export const areas = pgTable(
  'areas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    city: varchar('city', { length: 120 }).default('Karachi').notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).default('PK').notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('areas_city_name_uk').on(table.city, table.name)],
);

export const amenities = pgTable('amenities', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  category: varchar('category', { length: 120 }).default('Other Facilities').notNull(),
  subcategory: varchar('subcategory', { length: 120 }),
  valueType: amenityValueTypeEnum('value_type').default('boolean').notNull(),
  valueOptions: jsonb('value_options').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  purpose: listingPurposeEnum('purpose').notNull(),
  propertyCategory: propertyCategoryEnum('property_category').notNull(),
  propertySubtypeId: uuid('property_subtype_id')
    .notNull()
    .references(() => propertySubtypes.id, { onDelete: 'restrict' }),
  city: varchar('city', { length: 120 }).default('Karachi').notNull(),
  countryCode: varchar('country_code', { length: 2 }).default('PK').notNull(),
  areaId: uuid('area_id')
    .notNull()
    .references(() => areas.id, { onDelete: 'restrict' }),
  locationText: text('location_text').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  areaValue: numeric('area_value', { precision: 14, scale: 2 }).notNull(),
  areaUnit: areaUnitEnum('area_unit').notNull(),
  areaSqft: numeric('area_sqft', { precision: 14, scale: 2 }).notNull(),
  priceAmount: numeric('price_amount', { precision: 14, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('PKR').notNull(),
  installmentAvailable: boolean('installment_available').default(false).notNull(),
  readyForPossession: boolean('ready_for_possession').default(false).notNull(),
  bedroomsCount: smallint('bedrooms_count'),
  bathroomsCount: smallint('bathrooms_count'),
  imagesJson: jsonb('images_json').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  videoUrl: text('video_url'),
  platforms: platformEnum('platforms').array().default(sql`ARRAY['ZAMEEN']::listing_platform[]`).notNull(),
  status: listingStatusEnum('status').default('DRAFT').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const listingAmenities = pgTable(
  'listing_amenities',
  {
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    amenityId: uuid('amenity_id')
      .notNull()
      .references(() => amenities.id, { onDelete: 'restrict' }),
    valueJson: jsonb('value_json').$type<string | number | boolean | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.listingId, table.amenityId], name: 'listing_amenities_pk' })],
);

export const cityDefaults = {
  COUNTRY_CODE: 'PK',
  CITY: 'Karachi',
} as const;

export const areaUnitSqftFactor: Record<(typeof areaUnitEnum.enumValues)[number], number> = {
  MARLA: 272.25,
  SQFT: 1,
  SQYD: 9,
  KANAL: 5445,
};

export function toSqft(areaValue: number, areaUnit: (typeof areaUnitEnum.enumValues)[number]): number {
  return Number((areaValue * areaUnitSqftFactor[areaUnit]).toFixed(2));
}
