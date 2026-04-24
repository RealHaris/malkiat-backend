import {
  and,
  eq,
  inArray,
  ne,
  ilike,
  desc,
  asc,
  sql,
  type SQL,
  isNotNull,
} from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import {
  agencies,
  agencyMemberships,
  agencyInvitations,
  agencyFollowers,
  createUniqueAgencySlug,
  toAgencySlug,
  user,
  listings,
} from '@infra/db/drizzle/schema';

type CreateAgencyInput = {
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  ownerUserId: string;
  createdByUserId: string;
};

type AgencyMemberInput = {
  userId: string;
  membershipRole: 'owner' | 'co-owner' | 'admin' | 'manager' | 'agent';
};

type TokenClearedReason = 'expired' | 'revoked' | 'accepted' | 'declined';

export class DrizzleAgencyRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async findUserById(userId: string) {
    const rows = await this.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        isActive: user.isActive,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findUserByEmail(email: string) {
    const rows = await this.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        isActive: user.isActive,
      })
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);
    return rows[0] ?? null;
  }

  async createAgency(input: CreateAgencyInput) {
    const baseSlug = toAgencySlug(input.name);
    let slug = baseSlug;

    for (let i = 0; i < 10; i++) {
      const existing = await this.db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.slug, slug))
        .limit(1);
      if (!existing[0]) break;
      slug = createUniqueAgencySlug(baseSlug, `${Date.now().toString(36)}${i}`);
    }

    const createdRows = await this.db
      .insert(agencies)
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        logoUrl: input.logoUrl ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        ownerUserId: input.ownerUserId,
        createdByUserId: input.createdByUserId,
      })
      .returning();

    const created = createdRows[0];
    if (!created) throw new Error('Failed to create agency');

    await this.db.insert(agencyMemberships).values({
      agencyId: created.id,
      userId: input.ownerUserId,
      membershipRole: 'owner',
      status: 'active',
    });

    return created;
  }

  async getAgencyById(agencyId: string) {
    const rows = await this.db.select().from(agencies).where(eq(agencies.id, agencyId)).limit(1);
    return rows[0] ?? null;
  }

  async getMembership(agencyId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(agencyMemberships)
      .where(and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async listMembers(agencyId: string) {
    const members = await this.db
      .select({
        userId: agencyMemberships.userId,
        membershipRole: agencyMemberships.membershipRole,
        status: agencyMemberships.status,
        joinedAt: agencyMemberships.joinedAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(agencyMemberships)
      .innerJoin(user, eq(user.id, agencyMemberships.userId))
      .where(eq(agencyMemberships.agencyId, agencyId));

    return members;
  }

  async listActiveAgenciesForUser(userId: string) {
    return this.db
      .select({
        id: agencies.id,
        name: agencies.name,
        slug: agencies.slug,
        description: agencies.description,
        logoUrl: agencies.logoUrl,
        coverImageUrl: agencies.coverImageUrl,
        ownerUserId: agencies.ownerUserId,
        status: agencies.status,
        createdByUserId: agencies.createdByUserId,
        createdAt: agencies.createdAt,
        updatedAt: agencies.updatedAt,
        membershipRole: agencyMemberships.membershipRole,
      })
      .from(agencyMemberships)
      .innerJoin(agencies, eq(agencies.id, agencyMemberships.agencyId))
      .where(
        and(
          eq(agencyMemberships.userId, userId),
          eq(agencyMemberships.status, 'active'),
          eq(agencies.status, 'active'),
        ),
      );
  }

  async updateAgency(
    agencyId: string,
    patch: {
      name?: string;
      description?: string | null;
      logoUrl?: string | null;
      coverImageUrl?: string | null;
    },
  ) {
    const current = await this.getAgencyById(agencyId);
    if (!current) return null;

    let nextSlug: string | undefined;
    if (patch.name && patch.name !== current.name) {
      const baseSlug = toAgencySlug(patch.name);
      nextSlug = baseSlug;
      for (let i = 0; i < 10; i++) {
        const existing = await this.db
          .select({ id: agencies.id })
          .from(agencies)
          .where(and(eq(agencies.slug, nextSlug), ne(agencies.id, current.id)))
          .limit(1);
        if (!existing[0]) break;
        nextSlug = createUniqueAgencySlug(baseSlug, `${Date.now().toString(36)}${i}`);
      }
    }

    const rows = await this.db
      .update(agencies)
      .set({
        ...(patch.name ? { name: patch.name } : {}),
        ...(typeof patch.description !== 'undefined' ? { description: patch.description } : {}),
        ...(typeof patch.logoUrl !== 'undefined' ? { logoUrl: patch.logoUrl } : {}),
        ...(typeof patch.coverImageUrl !== 'undefined'
          ? { coverImageUrl: patch.coverImageUrl }
          : {}),
        ...(nextSlug ? { slug: nextSlug } : {}),
        updatedAt: new Date(),
      })
      .where(eq(agencies.id, agencyId))
      .returning();

    return rows[0] ?? null;
  }

  async archiveAgency(agencyId: string) {
    const rows = await this.db
      .update(agencies)
      .set({ status: 'inactive', archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(agencies.id, agencyId))
      .returning();
    return rows[0] ?? null;
  }

  async updateAgencyStatus(agencyId: string, status: 'active' | 'inactive') {
    const rows = await this.db
      .update(agencies)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'inactive' ? { archivedAt: new Date() } : {}),
      })
      .where(eq(agencies.id, agencyId))
      .returning();
    return rows[0] ?? null;
  }

  // --- Admin Queries ---

  async adminListAgencies(query: {
    page: number;
    perPage: number;
    q: string;
    status?: 'active' | 'inactive';
    sort: 'newest' | 'oldest' | 'memberCount' | 'listingCount' | 'name';
  }) {
    const conditions: SQL[] = [];
    if (query.status) {
      conditions.push(eq(agencies.status, query.status));
    }
    if (query.q) {
      const q = '%' + query.q + '%';
      conditions.push(
        sql`${ilike(agencies.name, q)} OR ${ilike(agencies.slug, q)} OR ${ilike(user.name, q)} OR ${ilike(user.email, q)}`,
      );
    }
    const whereClause = conditions.length ? and(...conditions) : sql`true`;

    let orderByClause;
    switch (query.sort) {
      case 'newest':
        orderByClause = desc(agencies.createdAt);
        break;
      case 'oldest':
        orderByClause = asc(agencies.createdAt);
        break;
      case 'name':
        orderByClause = asc(agencies.name);
        break;
      case 'memberCount':
        orderByClause = sql`member_count DESC`;
        break;
      case 'listingCount':
        orderByClause = sql`listing_count DESC`;
        break;
      default:
        orderByClause = desc(agencies.createdAt);
    }

    const baseQuery = this.db
      .select({
        id: agencies.id,
        name: agencies.name,
        slug: agencies.slug,
        status: agencies.status,
        logoUrl: agencies.logoUrl,
        createdAt: agencies.createdAt,
        ownerName: user.name,
        ownerEmail: user.email,
        memberCount:
          sql<number>`COALESCE((SELECT COUNT(*) FROM ${agencyMemberships} am WHERE am.agency_id = ${agencies.id} AND am.status = 'active'), 0)::int`.as(
            'member_count',
          ),
        listingCount:
          sql<number>`COALESCE((SELECT COUNT(*) FROM ${listings} l WHERE l.agency_id = ${agencies.id} AND l.status != 'DELETED'), 0)::int`.as(
            'listing_count',
          ),
      })
      .from(agencies)
      .leftJoin(user, eq(user.id, agencies.ownerUserId))
      .where(whereClause);

    const [totalRow] = await this.db
      .select({ totalItems: sql<number>`count(*)::int` })
      .from(agencies)
      .leftJoin(user, eq(user.id, agencies.ownerUserId))
      .where(whereClause);

    const items = await baseQuery
      .orderBy(orderByClause)
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    const totalItems = totalRow?.totalItems ?? 0;

    return {
      items,
      meta: {
        page: query.page,
        perPage: query.perPage,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.perPage)),
      },
    };
  }

  async adminGetAgencyStats(agencyId: string) {
    const [counts] = await this.db
      .select({
        totalMembers: sql<number>`COUNT(DISTINCT ${agencyMemberships.id})`.mapWith(Number),
        activeMembers:
          sql<number>`COUNT(DISTINCT CASE WHEN ${agencyMemberships.status} = 'active' THEN ${agencyMemberships.id} END)`.mapWith(
            Number,
          ),
      })
      .from(agencies)
      .leftJoin(agencyMemberships, eq(agencyMemberships.agencyId, agencies.id))
      .where(eq(agencies.id, agencyId));

    const [inviteCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(agencyInvitations)
      .where(
        and(eq(agencyInvitations.agencyId, agencyId), eq(agencyInvitations.status, 'pending')),
      );

    const followerCount = await this.getFollowerCount(agencyId);

    const [listingStats] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        draft: sql<number>`count(*) filter (where ${listings.status} = 'DRAFT')::int`,
        underReview: sql<number>`count(*) filter (where ${listings.status} = 'UNDER_REVIEW')::int`,
        published: sql<number>`count(*) filter (where ${listings.status} = 'PUBLISHED')::int`,
        unpublished: sql<number>`count(*) filter (where ${listings.status} = 'UNPUBLISHED')::int`,
        deleted: sql<number>`count(*) filter (where ${listings.status} = 'DELETED')::int`,
      })
      .from(listings)
      .where(eq(listings.agencyId, agencyId));

    return {
      members: {
        total: counts?.totalMembers ?? 0,
        active: counts?.activeMembers ?? 0,
      },
      pendingInvites: inviteCount?.count ?? 0,
      followers: followerCount,
      listings: {
        total: listingStats?.total ?? 0,
        draft: listingStats?.draft ?? 0,
        underReview: listingStats?.underReview ?? 0,
        published: listingStats?.published ?? 0,
        unpublished: listingStats?.unpublished ?? 0,
        deleted: listingStats?.deleted ?? 0,
      },
    };
  }

  async countCreatedAgenciesForUser(userId: string): Promise<number> {
    const rows = await this.db
      .select({ id: agencies.id })
      .from(agencies)
      .where(and(eq(agencies.createdByUserId, userId), eq(agencies.status, 'active')));
    return rows.length;
  }

  async addOrUpdateMembers(agencyId: string, members: AgencyMemberInput[]) {
    const now = new Date();
    for (const member of members) {
      const existing = await this.getMembership(agencyId, member.userId);
      if (!existing) {
        await this.db.insert(agencyMemberships).values({
          agencyId,
          userId: member.userId,
          membershipRole: member.membershipRole,
          status: 'active',
          joinedAt: now,
        });
        continue;
      }

      await this.db
        .update(agencyMemberships)
        .set({ membershipRole: member.membershipRole, status: 'active', updatedAt: now })
        .where(
          and(
            eq(agencyMemberships.agencyId, agencyId),
            eq(agencyMemberships.userId, member.userId),
          ),
        );
    }
  }

  async updateMemberRole(
    agencyId: string,
    userId: string,
    role: 'owner' | 'co-owner' | 'admin' | 'manager' | 'agent',
  ) {
    const rows = await this.db
      .update(agencyMemberships)
      .set({ membershipRole: role, status: 'active', updatedAt: new Date() })
      .where(and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, userId)))
      .returning();

    return rows[0] ?? null;
  }

  /** Hard delete a membership row */
  async removeMember(agencyId: string, userId: string) {
    const rows = await this.db
      .delete(agencyMemberships)
      .where(and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, userId)))
      .returning();

    return rows[0] ?? null;
  }

  async countActiveOwners(agencyId: string): Promise<number> {
    const owners = await this.db
      .select({ userId: agencyMemberships.userId })
      .from(agencyMemberships)
      .where(
        and(
          eq(agencyMemberships.agencyId, agencyId),
          eq(agencyMemberships.status, 'active'),
          eq(agencyMemberships.membershipRole, 'owner'),
        ),
      );

    return owners.length;
  }

  async usersExist(userIds: string[]) {
    if (userIds.length === 0) return [];
    return this.db
      .select({ id: user.id })
      .from(user)
      .where(and(inArray(user.id, userIds), eq(user.isActive, true)));
  }

  // ─── Invitations ──────────────────────────────────────────────────────────

  /**
   * Create a new invitation row (email or userId-based).
   * Exactly one of inviteeEmail / userId must be provided.
   */
  async createInvitation(input: {
    agencyId: string;
    userId?: string | null;
    inviteeEmail?: string | null;
    role: 'co-owner' | 'admin' | 'manager' | 'agent';
    tokenHash: string;
    expiresAt: Date;
  }) {
    const rows = await this.db
      .insert(agencyInvitations)
      .values({
        agencyId: input.agencyId,
        userId: input.userId ?? null,
        inviteeEmail: input.inviteeEmail ? input.inviteeEmail.toLowerCase() : null,
        role: input.role,
        status: 'pending',
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        lastSentAt: new Date(),
      })
      .returning();
    return rows[0] ?? null;
  }

  async getInvitation(inviteId: string) {
    const rows = await this.db
      .select()
      .from(agencyInvitations)
      .where(eq(agencyInvitations.id, inviteId))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Find pending invitation by tokenHash (for accept flow) */
  async getInvitationByTokenHash(tokenHash: string) {
    const rows = await this.db
      .select()
      .from(agencyInvitations)
      .where(
        and(
          eq(agencyInvitations.tokenHash, tokenHash),
          eq(agencyInvitations.status, 'pending'),
          isNotNull(agencyInvitations.tokenHash),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async previewInvitationByToken(tokenHash: string) {
    const rows = await this.db
      .select({
        inviteeEmail: agencyInvitations.inviteeEmail,
        role: agencyInvitations.role,
        agencyName: agencies.name,
        agencyLogo: agencies.logoUrl,
      })
      .from(agencyInvitations)
      .innerJoin(agencies, eq(agencies.id, agencyInvitations.agencyId))
      .where(
        and(
          eq(agencyInvitations.tokenHash, tokenHash),
          eq(agencyInvitations.status, 'pending'),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  /** Find an existing pending invite for the same agency+email (to avoid duplicates) */
  async findPendingInviteByEmail(agencyId: string, inviteeEmail: string) {
    const rows = await this.db
      .select()
      .from(agencyInvitations)
      .where(
        and(
          eq(agencyInvitations.agencyId, agencyId),
          eq(agencyInvitations.inviteeEmail, inviteeEmail.toLowerCase()),
          eq(agencyInvitations.status, 'pending'),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  /** Find an existing pending invite for the same agency+userId */
  async findPendingInviteByUserId(agencyId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(agencyInvitations)
      .where(
        and(
          eq(agencyInvitations.agencyId, agencyId),
          eq(agencyInvitations.userId, userId),
          eq(agencyInvitations.status, 'pending'),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async updateInvitationStatus(inviteId: string, status: 'accepted' | 'declined') {
    const rows = await this.db
      .update(agencyInvitations)
      .set({ status, updatedAt: new Date() })
      .where(eq(agencyInvitations.id, inviteId))
      .returning();
    return rows[0] ?? null;
  }

  /**
   * Mark invite accepted: update status, clear token, record who accepted + when.
   */
  async acceptInvitation(inviteId: string, acceptedByUserId: string) {
    const now = new Date();
    const rows = await this.db
      .update(agencyInvitations)
      .set({
        status: 'accepted',
        tokenHash: null,
        tokenClearedAt: now,
        tokenClearedReason: 'accepted',
        acceptedByUserId,
        acceptedAt: now,
        updatedAt: now,
      })
      .where(eq(agencyInvitations.id, inviteId))
      .returning();
    return rows[0] ?? null;
  }

  /**
   * Mark invite declined: update status, clear token.
   */
  async declineInvitation(inviteId: string) {
    const now = new Date();
    const rows = await this.db
      .update(agencyInvitations)
      .set({
        status: 'declined',
        tokenHash: null,
        tokenClearedAt: now,
        tokenClearedReason: 'declined',
        updatedAt: now,
      })
      .where(eq(agencyInvitations.id, inviteId))
      .returning();
    return rows[0] ?? null;
  }

  /**
   * Clear token fields on an invitation (for expiry/revocation).
   * Row remains for audit — only token data is nulled out.
   */
  async clearInvitationToken(tokenHash: string, reason: TokenClearedReason) {
    const now = new Date();
    await this.db
      .update(agencyInvitations)
      .set({
        tokenHash: null,
        tokenClearedAt: now,
        tokenClearedReason: reason,
        updatedAt: now,
      })
      .where(
        and(eq(agencyInvitations.tokenHash, tokenHash), eq(agencyInvitations.status, 'pending')),
      );
  }

  /**
   * Rotate token on resend: write new tokenHash + expiresAt, bump counters.
   * Returns updated row.
   */
  async rotateInvitationToken(inviteId: string, newTokenHash: string, newExpiresAt: Date) {
    const now = new Date();
    const rows = await this.db
      .update(agencyInvitations)
      .set({
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
        tokenClearedAt: null,
        tokenClearedReason: null,
        lastSentAt: now,
        resendCount: sql`${agencyInvitations.resendCount} + 1`,
        updatedAt: now,
      })
      .where(eq(agencyInvitations.id, inviteId))
      .returning();
    return rows[0] ?? null;
  }

  /** Hard delete an invitation row */
  async deleteInvitation(inviteId: string) {
    const rows = await this.db
      .delete(agencyInvitations)
      .where(eq(agencyInvitations.id, inviteId))
      .returning();
    return rows[0] ?? null;
  }

  async listInvitationsForAgency(agencyId: string) {
    return this.db
      .select()
      .from(agencyInvitations)
      .where(eq(agencyInvitations.agencyId, agencyId))
      .orderBy(desc(agencyInvitations.createdAt));
  }

  async listPendingInvitationsForAgency(agencyId: string) {
    return this.db
      .select()
      .from(agencyInvitations)
      .where(
        and(eq(agencyInvitations.agencyId, agencyId), eq(agencyInvitations.status, 'pending')),
      );
  }

  async listPendingInvitationsForUser(userId: string) {
    return this.db
      .select()
      .from(agencyInvitations)
      .where(and(eq(agencyInvitations.userId, userId), eq(agencyInvitations.status, 'pending')));
  }

  // --- Followers ---

  async followAgency(agencyId: string, userId: string) {
    await this.db.insert(agencyFollowers).values({ agencyId, userId }).onConflictDoNothing();
  }

  async unfollowAgency(agencyId: string, userId: string) {
    await this.db
      .delete(agencyFollowers)
      .where(and(eq(agencyFollowers.agencyId, agencyId), eq(agencyFollowers.userId, userId)));
  }

  async getFollowerCount(agencyId: string): Promise<number> {
    const rows = await this.db
      .select({ userId: agencyFollowers.userId })
      .from(agencyFollowers)
      .where(eq(agencyFollowers.agencyId, agencyId));
    return rows.length;
  }

  // --- Ownership Transfer ---

  async transferOwnership(
    agencyId: string,
    newOwnerId: string,
    oldOwnerId: string,
    demoteOldOwnerTo?: 'co-owner' | 'admin' | 'manager' | 'agent',
  ) {
    await this.db.transaction(async (tx) => {
      await tx
        .update(agencies)
        .set({ ownerUserId: newOwnerId, updatedAt: new Date() })
        .where(eq(agencies.id, agencyId));

      await tx
        .update(agencyMemberships)
        .set({ membershipRole: 'owner', status: 'active', updatedAt: new Date() })
        .where(
          and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, newOwnerId)),
        );

      if (demoteOldOwnerTo) {
        await tx
          .update(agencyMemberships)
          .set({ membershipRole: demoteOldOwnerTo, updatedAt: new Date() })
          .where(
            and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, oldOwnerId)),
          );
      }
    });
  }
}
