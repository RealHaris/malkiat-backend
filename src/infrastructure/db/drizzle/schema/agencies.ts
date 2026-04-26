import {
  boolean,
  integer,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './better-auth';

export const agencyStatusEnum = pgEnum('agency_status', ['active', 'inactive']);
export const agencyMembershipRoleEnum = pgEnum('agency_membership_role', [
  'owner',
  'co-owner',
  'admin',
  'manager',
  'agent',
]);
export const agencyMembershipStatusEnum = pgEnum('agency_membership_status', ['active', 'removed']);
export const agencyInviteStatusEnum = pgEnum('agency_invite_status', [
  'pending',
  'accepted',
  'declined',
]);
export const agencyInviteTokenClearedReasonEnum = pgEnum('agency_invite_token_cleared_reason', [
  'expired',
  'revoked',
  'accepted',
  'declined',
]);

export const agencies = pgTable(
  'agencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    coverImageUrl: text('cover_image_url'),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    status: agencyStatusEnum('status').default('active').notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    hideFollowerCount: boolean('hide_follower_count').default(false).notNull(),
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

export const agencyInvitations = pgTable(
  'agency_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    inviteeEmail: text('invitee_email'),
    role: agencyMembershipRoleEnum('role').default('agent').notNull(),
    status: agencyInviteStatusEnum('status').default('pending').notNull(),
    tokenHash: text('token_hash'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    tokenClearedAt: timestamp('token_cleared_at', { withTimezone: true }),
    tokenClearedReason: agencyInviteTokenClearedReasonEnum('token_cleared_reason'),
    acceptedByUserId: text('accepted_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    resendCount: integer('resend_count').default(0).notNull(),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('agency_invitations_agency_idx').on(table.agencyId),
    index('agency_invitations_user_idx').on(table.userId),
    index('agency_invitations_invitee_email_idx').on(table.inviteeEmail),
    index('agency_invitations_token_hash_idx').on(table.tokenHash),
  ],
);

export const agencyFollowers = pgTable(
  'agency_followers',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('agency_followers_user_agency_uk').on(table.userId, table.agencyId),
    index('agency_followers_agency_idx').on(table.agencyId),
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
