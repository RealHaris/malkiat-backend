import { Body, Controller, ForbiddenException, Get, Inject, Patch, Post } from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import { DI } from '@app/di.tokens';
import { user } from '@infra/db/drizzle/schema';
import { API_OPERATIONS, API_RESPONSES, API_HEADERS } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  image: z.string().url().nullable().optional(),
  phoneNumber: z.string().min(6).max(25).nullable().optional(),
});

type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>) {}

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
}
