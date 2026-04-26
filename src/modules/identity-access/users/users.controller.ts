import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { and, desc, eq, ilike, inArray, ne, sql, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from 'better-auth/crypto';

import { DI } from '@app/di.tokens';
import { account, agencies, agencyMemberships, listings, user } from '@infra/db/drizzle/schema';
import { API_OPERATIONS, API_RESPONSES, API_HEADERS } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  image: z.string().url().nullable().optional(),
  phoneNumber: z.string().min(6).max(25).nullable().optional(),
});

type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(120).default(''),
  role: z.enum(['admin', 'user']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const createAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  platformRole: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
  image: z.string().url().nullable().optional(),
  phoneNumber: z.string().trim().min(6).max(25).nullable().optional(),
  emailVerified: z.boolean().optional(),
  phoneNumberVerified: z.boolean().optional(),
});

const updateAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  platformRole: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
  image: z.string().url().nullable().optional(),
  phoneNumber: z.string().trim().min(6).max(25).nullable().optional(),
  emailVerified: z.boolean().optional(),
  phoneNumberVerified: z.boolean().optional(),
});

const bulkDeleteUsersSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(200),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const updateUserPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

const changeMyPasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
type BulkDeleteUsersDto = z.infer<typeof bulkDeleteUsersSchema>;
type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
type UpdateUserPasswordDto = z.infer<typeof updateUserPasswordSchema>;
type ChangeMyPasswordDto = z.infer<typeof changeMyPasswordSchema>;

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>) {}

  private async requireAdmin(session: UserSession) {
    const rows = await this.db
      .select({
        id: user.id,
        platformRole: user.platformRole,
        isActive: user.isActive,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const actor = rows[0];
    if (!actor || !actor.isActive || actor.platformRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return actor;
  }

  @Get('me')
  @ApiOperation(API_OPERATIONS.GET_CURRENT_USER)
  @ApiResponse(API_RESPONSES.GET_CURRENT_USER)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async me(@Session() session: UserSession) {
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        platformRole: user.platformRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const found = rows[0];
    if (!found) throw new ForbiddenException('User not found');

    return found;
  }

  @Patch('me')
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async updateProfile(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    const rows = await this.db
      .update(user)
      .set({
        ...(typeof dto.name !== 'undefined' ? { name: dto.name } : {}),
        ...(typeof dto.image !== 'undefined' ? { image: dto.image } : {}),
        ...(typeof dto.phoneNumber !== 'undefined' ? { phoneNumber: dto.phoneNumber } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    return rows[0] ?? null;
  }

  @Patch('me/password')
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async changeMyPassword(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(changeMyPasswordSchema)) dto: ChangeMyPasswordDto,
  ) {
    const [credential] = await this.db
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, 'credential')))
      .limit(1);

    if (!credential?.password) {
      throw new BadRequestException('Password login is not available for this account');
    }

    const isCurrentPasswordValid = await verifyPassword({
      hash: credential.password,
      password: dto.currentPassword,
    });

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const nextPasswordHash = await hashPassword(dto.newPassword);
    await this.db
      .update(account)
      .set({ password: nextPasswordHash, updatedAt: new Date() })
      .where(eq(account.id, credential.id));

    return { ok: true };
  }

  @Get('me/stats')
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async meStats(@Session() session: UserSession) {
    const [profile] = await this.db
      .select({
        id: user.id,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        phoneNumberVerified: user.phoneNumberVerified,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!profile) {
      throw new ForbiddenException('User not found');
    }

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
      .where(eq(listings.ownerId, session.user.id));

    const [ownedAgencyCount] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(agencies)
      .where(and(eq(agencies.ownerUserId, session.user.id), eq(agencies.status, 'active')));

    const [membershipCount] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(agencyMemberships)
      .where(
        and(eq(agencyMemberships.userId, session.user.id), eq(agencyMemberships.status, 'active')),
      );

    return {
      account: {
        isActive: profile.isActive,
        emailVerified: profile.emailVerified,
        phoneNumberVerified: profile.phoneNumberVerified ?? false,
      },
      listings: {
        total: listingStats?.total ?? 0,
        draft: listingStats?.draft ?? 0,
        underReview: listingStats?.underReview ?? 0,
        published: listingStats?.published ?? 0,
        unpublished: listingStats?.unpublished ?? 0,
        deleted: listingStats?.deleted ?? 0,
      },
      agencies: {
        ownedActive: ownedAgencyCount?.total ?? 0,
        membershipsActive: membershipCount?.total ?? 0,
      },
    };
  }

  @Post('me/deactivate')
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async deactivateProfile(@Session() session: UserSession) {
    await this.db
      .update(user)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));
    return { ok: true };
  }

  @Get('public')
  @AllowAnonymous()
  @ApiOperation(API_OPERATIONS.PUBLIC_ROUTE)
  @ApiResponse(API_RESPONSES.PUBLIC_ROUTE)
  publicRoute() {
    return { ok: true };
  }

  @Get('optional')
  @OptionalAuth()
  @ApiOperation(API_OPERATIONS.OPTIONAL_AUTH_ROUTE)
  @ApiResponse(API_RESPONSES.OPTIONAL_AUTH_ROUTE)
  optional(@Session() session?: UserSession) {
    return { authenticated: !!session };
  }

  @Get('admin/list')
  async listUsers(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQueryDto,
  ) {
    await this.requireAdmin(session);

    const conditions: SQL[] = [];

    if (query.q) {
      conditions.push(
        sql`${ilike(user.name, `%${query.q}%`)} OR ${ilike(user.email, `%${query.q}%`)}`,
      );
    }

    if (query.role) {
      conditions.push(eq(user.platformRole, query.role));
    }

    if (query.status) {
      conditions.push(eq(user.isActive, query.status === 'active'));
    }

    const whereClause = conditions.length ? and(...conditions) : sql`true`;

    const [totalRow] = await this.db
      .select({ totalItems: sql<number>`count(*)::int` })
      .from(user)
      .where(whereClause);

    const items = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        platformRole: user.platformRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
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

  @Post('admin')
  async createAdminUser(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(createAdminUserSchema)) dto: CreateAdminUserDto,
  ) {
    await this.requireAdmin(session);

    const existing = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, dto.email))
      .limit(1);

    if (existing[0]) {
      throw new BadRequestException('User already exists with this email');
    }

    const hashedPassword = await hashPassword(dto.password);
    const now = new Date();
    const userId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: dto.name,
        email: dto.email,
        emailVerified: dto.emailVerified ?? false,
        image: dto.image ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        phoneNumberVerified: dto.phoneNumberVerified ?? false,
        platformRole: dto.platformRole ?? 'user',
        isActive: dto.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    });

    const [created] = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        platformRole: user.platformRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return { user: created };
  }

  @Patch('admin/:userId')
  async updateAdminUser(
    @Session() session: UserSession,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateAdminUserSchema)) dto: UpdateAdminUserDto,
  ) {
    await this.requireAdmin(session);

    if (session.user.id === userId && dto.platformRole === 'user') {
      throw new BadRequestException('You cannot demote your own admin role');
    }

    if (session.user.id === userId && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    if (dto.email) {
      const existing = await this.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.email, dto.email), ne(user.id, userId)))
        .limit(1);

      if (existing[0]) {
        throw new BadRequestException('Email is already in use');
      }
    }

    const updates = {
      ...(typeof dto.name !== 'undefined' ? { name: dto.name } : {}),
      ...(typeof dto.email !== 'undefined' ? { email: dto.email } : {}),
      ...(typeof dto.platformRole !== 'undefined' ? { platformRole: dto.platformRole } : {}),
      ...(typeof dto.isActive !== 'undefined' ? { isActive: dto.isActive } : {}),
      ...(typeof dto.image !== 'undefined' ? { image: dto.image } : {}),
      ...(typeof dto.phoneNumber !== 'undefined' ? { phoneNumber: dto.phoneNumber } : {}),
      ...(typeof dto.emailVerified !== 'undefined' ? { emailVerified: dto.emailVerified } : {}),
      ...(typeof dto.phoneNumberVerified !== 'undefined'
        ? { phoneNumberVerified: dto.phoneNumberVerified }
        : {}),
      updatedAt: new Date(),
    };

    const [updated] = await this.db.update(user).set(updates).where(eq(user.id, userId)).returning({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
      platformRole: user.platformRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return { user: updated };
  }

  @Delete('admin/:userId')
  async deleteAdminUser(@Session() session: UserSession, @Param('userId') userId: string) {
    await this.requireAdmin(session);

    if (session.user.id === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const deleted = await this.db
      .delete(user)
      .where(eq(user.id, userId))
      .returning({ id: user.id });

    if (!deleted[0]) {
      throw new NotFoundException('User not found');
    }

    return { ok: true };
  }

  @Post('admin/bulk-delete')
  async bulkDeleteUsers(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(bulkDeleteUsersSchema)) dto: BulkDeleteUsersDto,
  ) {
    await this.requireAdmin(session);

    if (dto.userIds.includes(session.user.id)) {
      throw new BadRequestException('You cannot bulk delete your own account');
    }

    const deleted = await this.db
      .delete(user)
      .where(inArray(user.id, dto.userIds))
      .returning({ id: user.id });

    return { ok: true, deletedCount: deleted.length };
  }

  @Patch('admin/:userId/status')
  async updateUserStatus(
    @Session() session: UserSession,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserStatusSchema)) dto: UpdateUserStatusDto,
  ) {
    await this.requireAdmin(session);

    if (session.user.id === userId && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const [updated] = await this.db
      .update(user)
      .set({ isActive: dto.isActive, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id, isActive: user.isActive });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return { user: updated };
  }

  @Patch('admin/:userId/password')
  async updateUserPassword(
    @Session() session: UserSession,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserPasswordSchema)) dto: UpdateUserPasswordDto,
  ) {
    await this.requireAdmin(session);

    const [targetUser] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await hashPassword(dto.newPassword);
    const now = new Date();

    const [existingCredential] = await this.db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
      .limit(1);

    if (existingCredential) {
      await this.db
        .update(account)
        .set({ password: hashedPassword, updatedAt: now })
        .where(eq(account.id, existingCredential.id));
    } else {
      await this.db.insert(account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true };
  }
}
