import { and, eq, inArray, ne } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import {
  agencies,
  agencyMemberships,
  createUniqueAgencySlug,
  toAgencySlug,
  user,
} from '@infra/db/drizzle/schema';

type CreateAgencyInput = {
  name: string;
  description?: string;
  logoUrl?: string;
  ownerUserId: string;
  createdByUserId: string;
};

type AgencyMemberInput = {
  userId: string;
  membershipRole: 'owner' | 'agent';
};

export class DrizzleAgencyRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async findUserById(userId: string) {
    const rows = await this.db
      .select({
        id: user.id,
        email: user.email,
        platformRole: user.platformRole,
        isActive: user.isActive,
      })
      .from(user)
      .where(eq(user.id, userId))
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

  async updateAgency(
    agencyId: string,
    patch: {
      name?: string;
      description?: string | null;
      logoUrl?: string | null;
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
      .set({ status: 'archived', archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(agencies.id, agencyId))
      .returning();
    return rows[0] ?? null;
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
        .where(and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, member.userId)));
    }
  }

  async updateMemberRole(agencyId: string, userId: string, role: 'owner' | 'agent') {
    const rows = await this.db
      .update(agencyMemberships)
      .set({ membershipRole: role, status: 'active', updatedAt: new Date() })
      .where(and(eq(agencyMemberships.agencyId, agencyId), eq(agencyMemberships.userId, userId)))
      .returning();

    return rows[0] ?? null;
  }

  async removeMember(agencyId: string, userId: string) {
    const rows = await this.db
      .update(agencyMemberships)
      .set({ status: 'removed', updatedAt: new Date() })
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
}
