import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { user } from './better-auth';

export const agencyStatusEnum = pgEnum('agency_status', ['active', 'archived']);
export const agencyMembershipRoleEnum = pgEnum('agency_membership_role', ['owner', 'agent']);
export const agencyMembershipStatusEnum = pgEnum('agency_membership_status', ['active', 'removed']);

export const agencies = pgTable(
  'agencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    status: agencyStatusEnum('status').default('active').notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('agencies_slug_uk').on(table.slug),
    index('agencies_owner_status_idx').on(table.ownerUserId, table.status),
  ],
);

export const agencyMemberships = pgTable(
  'agency_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    membershipRole: agencyMembershipRoleEnum('membership_role').default('agent').notNull(),
    status: agencyMembershipStatusEnum('status').default('active').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('agency_memberships_agency_user_uk').on(table.agencyId, table.userId),
    index('agency_memberships_user_status_idx').on(table.userId, table.status),
    index('agency_memberships_agency_status_idx').on(table.agencyId, table.status),
  ],
);

export function toAgencySlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return slug || `agency-${Date.now()}`;
}

export function sanitizeAgencySlug(nameOrSlug: string): string {
  return nameOrSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function createUniqueAgencySlug(base: string, suffix?: string): string {
  const normalized = sanitizeAgencySlug(base);
  if (!suffix) return normalized;
  return `${normalized}-${suffix}`;
}
