import { jsonb, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id'),
  title: text('title').notNull(),
  description: text('description'),
  priceAmount: numeric('price_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('PKR'),
  propertyType: varchar('property_type', { length: 50 }),
  status: varchar('status', { length: 20 }).default('DRAFT'),
  addressJson: jsonb('address_json'),
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
