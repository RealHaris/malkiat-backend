import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { DI } from '@app/di.tokens';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { DrizzleAgencyRepository } from '../infrastructure/drizzle-agency.repository';
import { AgencyInvitationsService } from '../agency-invitations.service';
import { addAgencyMembersSchema, type AddAgencyMembersDto } from './dto/add-agency-members.dto';
import { createAgencySchema, type CreateAgencyDto } from './dto/create-agency.dto';
import {
  updateAgencyMemberSchema,
  type UpdateAgencyMemberDto,
} from './dto/update-agency-member.dto';
import { updateAgencySchema, type UpdateAgencyDto } from './dto/update-agency.dto';
import { transferOwnershipSchema, type TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { requireAgencyOwnerOrAdmin, canPostForAgency, canManageMember } from './agency-authz';
import {
  listAdminAgenciesQuerySchema,
  updateAgencyStatusSchema,
  type ListAdminAgenciesQueryDto,
  type UpdateAgencyStatusDto,
} from './dto/admin-agencies.dto';
import { acceptInviteByTokenSchema, type AcceptInviteByTokenDto } from './dto/invite-by-token.dto';

@Controller('agencies')
export class AgenciesController {
  constructor(
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
    private readonly invitationsService: AgencyInvitationsService,
  ) {}

  private async requireAdmin(session: UserSession) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive || actor.platformRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return actor;
  }

  // ─── Admin Routes ─────────────────────────────────────────────────────────

  @Get('admin/list')
  async adminListAgencies(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(listAdminAgenciesQuerySchema)) query: ListAdminAgenciesQueryDto,
  ) {
    await this.requireAdmin(session);
    return this.agencyRepo.adminListAgencies(query);
  }

  @Get('admin/:agencyId')
  async adminGetAgency(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    await this.requireAdmin(session);
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    const [stats, members, invites] = await Promise.all([
      this.agencyRepo.adminGetAgencyStats(agencyId),
      this.agencyRepo.listMembers(agencyId),
      this.agencyRepo.listInvitationsForAgency(agencyId),
    ]);
    return { agency, members, invites, stats };
  }

  @Post('admin')
  async adminCreateAgency(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(createAgencySchema)) dto: CreateAgencyDto,
  ) {
    await this.requireAdmin(session);
    const agency = await this.agencyRepo.createAgency({
      name: dto.name,
      description: dto.description,
      logoUrl: dto.logoUrl,
      coverImageUrl: dto.coverImageUrl,
      ownerUserId: session.user.id,
      createdByUserId: session.user.id,
    });
    return { agency };
  }

  @Patch('admin/:agencyId')
  async adminUpdateAgency(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Body(new ZodValidationPipe(updateAgencySchema)) dto: UpdateAgencyDto,
  ) {
    await this.requireAdmin(session);
    const updated = await this.agencyRepo.updateAgency(agencyId, dto);
    if (!updated) throw new NotFoundException('Agency not found');
    return { agency: updated };
  }

  @Patch('admin/:agencyId/status')
  async adminUpdateAgencyStatus(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Body(new ZodValidationPipe(updateAgencyStatusSchema)) dto: UpdateAgencyStatusDto,
  ) {
    await this.requireAdmin(session);
    const updated = await this.agencyRepo.updateAgencyStatus(agencyId, dto.status);
    if (!updated) throw new NotFoundException('Agency not found');
    return { agency: updated };
  }

  @Delete('admin/:agencyId/members/:userId')
  async adminRemoveMember(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Param('userId') userId: string,
  ) {
    await this.requireAdmin(session);
    const targetMembership = await this.agencyRepo.getMembership(agencyId, userId);
    if (!targetMembership) throw new NotFoundException('Agency member not found');
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (agency?.ownerUserId === userId) {
      throw new BadRequestException('Cannot remove the primary owner. Transfer ownership first.');
    }
    const removed = await this.agencyRepo.removeMember(agencyId, userId);
    return { member: removed };
  }

  @Delete('admin/:agencyId')
  async adminDeactivateAgency(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
  ) {
    await this.requireAdmin(session);
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    const updated = await this.agencyRepo.updateAgencyStatus(agencyId, 'inactive');
    return { agency: updated };
  }

  // ─── Regular Routes ───────────────────────────────────────────────────────

  @Post()
  async create(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(createAgencySchema)) dto: CreateAgencyDto,
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive)
      throw new ForbiddenException('Inactive users cannot create agencies');
    const createdCount = await this.agencyRepo.countCreatedAgenciesForUser(session.user.id);
    if (createdCount >= 3 && actor.platformRole !== 'admin') {
      throw new BadRequestException('You can only create a maximum of 3 agencies');
    }
    const agency = await this.agencyRepo.createAgency({
      name: dto.name,
      description: dto.description,
      logoUrl: dto.logoUrl,
      coverImageUrl: dto.coverImageUrl,
      ownerUserId: session.user.id,
      createdByUserId: session.user.id,
    });
    return { agency };
  }

  @Get('me/list')
  async listMyAgencies(@Session() session: UserSession) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive)
      throw new ForbiddenException('Inactive users cannot access agencies');
    const agencies = await this.agencyRepo.listActiveAgenciesForUser(session.user.id);
    return { agencies };
  }

  @Get('me/invites')
  async listMyInvites(@Session() session: UserSession) {
    const invites = await this.agencyRepo.listPendingInvitationsForUser(session.user.id);
    return { invites };
  }

  @Get(':agencyId')
  async getAgency(@Param('agencyId') agencyId: string) {
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    const followers = agency.hideFollowerCount
      ? undefined
      : await this.agencyRepo.getFollowerCount(agencyId);
    return { agency, followers };
  }

  @Get('by-slug/:slug')
  async getAgencyBySlug(@Session() session: UserSession, @Param('slug') slug: string) {
    const agency = await this.agencyRepo.getAgencyBySlug(slug);
    if (!agency) throw new NotFoundException('Agency not found');

    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');

    const membership = await this.agencyRepo.getMembership(agency.id, session.user.id);

    // Enforce access: admin or active agency member only
    if (actor.platformRole !== 'admin' && (!membership || membership.status !== 'active')) {
      throw new ForbiddenException('You do not have access to this agency profile');
    }

    const [stats, members] = await Promise.all([
      this.agencyRepo.adminGetAgencyStats(agency.id),
      this.agencyRepo.listMembers(agency.id),
    ]);

    const canEditAgency =
      actor.platformRole === 'admin' ||
      membership?.membershipRole === 'owner' ||
      membership?.membershipRole === 'co-owner' ||
      membership?.membershipRole === 'admin';

    const canManageMembers =
      actor.platformRole === 'admin' ||
      membership?.membershipRole === 'owner' ||
      membership?.membershipRole === 'co-owner' ||
      membership?.membershipRole === 'admin';

    return {
      agency,
      stats: {
        memberCount: stats.members.total,
        listingCount: stats.listings.total,
        activeListingCount: stats.listings.published,
      },
      members,
      capabilities: {
        canEditAgency,
        canManageMembers,
      },
    };
  }

  @Patch(':agencyId')
  async updateAgency(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Body(new ZodValidationPipe(updateAgencySchema)) dto: UpdateAgencyDto,
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');
    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    requireAgencyOwnerOrAdmin(
      { id: actor.id, platformRole: actor.platformRole },
      membership ?? undefined,
    );
    const updated = await this.agencyRepo.updateAgency(agencyId, dto);
    if (!updated) throw new NotFoundException('Agency not found');
    return { agency: updated };
  }

  @Post(':agencyId/archive')
  async archiveAgency(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== session.user.id && actor.platformRole !== 'admin') {
      throw new ForbiddenException('Only the primary owner can archive the agency');
    }
    const deactivated = await this.agencyRepo.updateAgencyStatus(agencyId, 'inactive');
    return { agency: deactivated };
  }

  // ─── Members ──────────────────────────────────────────────────────────────

  @Get(':agencyId/members')
  async listMembers(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');
    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    if (
      !canPostForAgency({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined)
    ) {
      throw new ForbiddenException('You are not allowed to view agency members');
    }
    const members = await this.agencyRepo.listMembers(agencyId);
    return { members };
  }

  /**
   * POST /agencies/:agencyId/members
   * Invite by userId (existing user) OR by email (new or existing user).
   * Mode C: if email resolves to an existing user, store userId too.
   */
  @Post(':agencyId/members')
  async addMembers(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Body(new ZodValidationPipe(addAgencyMembersSchema)) dto: AddAgencyMembersDto,
  ) {
    const [actor, agency] = await Promise.all([
      this.agencyRepo.findUserById(session.user.id),
      this.agencyRepo.getAgencyById(agencyId),
    ]);
    if (!actor) throw new ForbiddenException('User not found');
    if (!agency) throw new NotFoundException('Agency not found');

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);

    const results: { email: string; status: string }[] = [];

    for (const member of dto.members) {
      const role = member.membershipRole as 'co-owner' | 'admin' | 'manager' | 'agent';

      if (
        !canManageMember(
          { id: actor.id, platformRole: actor.platformRole },
          membership ?? undefined,
          undefined,
          role,
        )
      ) {
        throw new ForbiddenException(`You do not have permission to invite users as ${role}`);
      }

      let resolvedUserId: string | null = null;
      let resolvedEmail: string | null = null;

      if (member.userId) {
        // userId path
        const target = await this.agencyRepo.findUserById(member.userId);
        if (!target || !target.isActive)
          throw new BadRequestException(`User ${member.userId} not found or inactive`);
        resolvedUserId = target.id;
        resolvedEmail = target.email;

        // Check for existing pending invite
        const existing = await this.agencyRepo.findPendingInviteByUserId(agencyId, resolvedUserId);
        if (existing) {
          results.push({ email: resolvedEmail, status: 'already_invited' });
          continue;
        }
      } else if (member.email) {
        // email path — try to resolve to existing user
        const existingUser = await this.agencyRepo.findUserByEmail(member.email);
        resolvedEmail = member.email.toLowerCase();
        resolvedUserId = existingUser?.isActive ? existingUser.id : null;

        // Check for existing pending invite by email
        const existing = await this.agencyRepo.findPendingInviteByEmail(agencyId, resolvedEmail);
        if (existing) {
          results.push({ email: resolvedEmail, status: 'already_invited' });
          continue;
        }
      } else {
        throw new BadRequestException('Each member must have either userId or email');
      }

      // Issue token + store in Redis
      const expiresAt = this.invitationsService.expiresAt();
      const rawToken = this.invitationsService.generateToken();
      const tokenHash = this.invitationsService.hashToken(rawToken);

      // Create DB row first to get the inviteId
      const invite = await this.agencyRepo.createInvitation({
        agencyId,
        userId: resolvedUserId,
        inviteeEmail: resolvedEmail,
        role,
        tokenHash,
        expiresAt,
      });

      if (!invite) throw new BadRequestException('Failed to create invitation');

      // Store token in Redis (fire + forget to not block, but await for consistency)
      await this.invitationsService.storeTokenInRedis(tokenHash, {
        inviteId: invite.id,
        agencyId,
        inviteeEmail: resolvedEmail!,
      });

      // Send invitation email
      await this.invitationsService.sendInvitationEmail({
        to: resolvedEmail!,
        agencyName: agency.name,
        inviterName: actor.name,
        role,
        token: rawToken,
        agencyId,
      });

      results.push({ email: resolvedEmail!, status: 'invited' });
    }

    return { ok: true, results };
  }

  @Patch(':agencyId/members/:userId')
  async updateMemberRole(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateAgencyMemberSchema)) dto: UpdateAgencyMemberDto,
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');
    const [membership, targetMembership] = await Promise.all([
      this.agencyRepo.getMembership(agencyId, session.user.id),
      this.agencyRepo.getMembership(agencyId, userId),
    ]);
    if (!targetMembership) throw new NotFoundException('Agency member not found');
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (agency?.ownerUserId === userId) {
      throw new BadRequestException(
        'Cannot demote the primary owner. Use transfer ownership instead.',
      );
    }
    if (
      !canManageMember(
        { id: actor.id, platformRole: actor.platformRole },
        membership ?? undefined,
        targetMembership.membershipRole,
        dto.membershipRole,
      )
    ) {
      throw new ForbiddenException('You do not have permission to perform this role update');
    }
    const updated = await this.agencyRepo.updateMemberRole(agencyId, userId, dto.membershipRole);
    return { member: updated };
  }

  @Delete(':agencyId/members/:userId')
  async removeMember(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Param('userId') userId: string,
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');
    const [membership, targetMembership] = await Promise.all([
      this.agencyRepo.getMembership(agencyId, session.user.id),
      this.agencyRepo.getMembership(agencyId, userId),
    ]);
    if (!targetMembership) throw new NotFoundException('Agency member not found');
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (agency?.ownerUserId === userId)
      throw new BadRequestException('Cannot remove the primary owner.');
    if (session.user.id !== userId) {
      if (
        !canManageMember(
          { id: actor.id, platformRole: actor.platformRole },
          membership ?? undefined,
          targetMembership.membershipRole,
        )
      ) {
        throw new ForbiddenException('You do not have permission to remove this member');
      }
    }
    // Hard delete
    const removed = await this.agencyRepo.removeMember(agencyId, userId);
    return { member: removed };
  }

  @Post(':agencyId/transfer-ownership')
  async transferOwnership(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Body(new ZodValidationPipe(transferOwnershipSchema)) dto: TransferOwnershipDto,
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== session.user.id && actor.platformRole !== 'admin') {
      throw new ForbiddenException('Only the current primary owner can transfer ownership');
    }
    const targetMembership = await this.agencyRepo.getMembership(agencyId, dto.newOwnerId);
    if (!targetMembership || targetMembership.status !== 'active') {
      throw new BadRequestException('The new owner must be an active member of the agency');
    }
    await this.agencyRepo.transferOwnership(
      agencyId,
      dto.newOwnerId,
      agency.ownerUserId,
      dto.demoteOldOwnerTo,
    );
    return { ok: true };
  }

  // ─── Invitations ──────────────────────────────────────────────────────────

  @Get('invitations/preview')
  async previewInvite(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    const tokenHash = this.invitationsService.hashToken(token);
    const preview = await this.agencyRepo.previewInvitationByToken(tokenHash);
    if (!preview) throw new NotFoundException('Invitation not found or expired');
    return preview;
  }

  @Get(':agencyId/invites')
  async listAgencyInvites(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    const [actor, membership] = await Promise.all([
      this.agencyRepo.findUserById(session.user.id),
      this.agencyRepo.getMembership(agencyId, session.user.id),
    ]);
    requireAgencyOwnerOrAdmin(
      { id: actor!.id, platformRole: actor!.platformRole },
      membership ?? undefined,
    );
    const invites = await this.agencyRepo.listInvitationsForAgency(agencyId);
    return { invites };
  }

  /**
   * POST /agencies/invitations/accept
   * Token-based accept — works for both new and existing users.
   * User must be logged in. Their email must match inviteeEmail.
   */
  @Post('invitations/accept')
  async acceptInviteByToken(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(acceptInviteByTokenSchema)) dto: AcceptInviteByTokenDto,
  ) {
    // Primary check: Redis (fast, no DB)
    const validated = await this.invitationsService.validateToken(dto.token);
    if (!validated) {
      throw new BadRequestException('Invitation token is invalid, expired, or has been revoked');
    }
    const { payload, tokenHash } = validated;

    // Verify agencyId matches
    if (payload.agencyId !== dto.agencyId) {
      throw new BadRequestException('Token does not match the provided agency');
    }

    // Get logged-in user's email
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive) throw new ForbiddenException('User not found or inactive');

    // Email must match (case-insensitive)
    if (actor.email.toLowerCase() !== payload.inviteeEmail.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Fetch DB row (secondary check: confirm still pending + get role)
    const invite = await this.agencyRepo.getInvitationByTokenHash(tokenHash);
    if (!invite || invite.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    // Run accept + membership upsert in parallel where possible
    const [updatedInvite] = await Promise.all([
      this.agencyRepo.acceptInvitation(invite.id, session.user.id),
      this.agencyRepo.addOrUpdateMembers(dto.agencyId, [
        { userId: session.user.id, membershipRole: invite.role as any },
      ]),
      this.invitationsService.deleteTokenFromRedis(tokenHash),
    ]);

    return { ok: true, invite: updatedInvite };
  }

  /**
   * POST /agencies/invitations/reject
   * Token-based reject.
   */
  @Post('invitations/reject')
  async rejectInviteByToken(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(acceptInviteByTokenSchema)) dto: AcceptInviteByTokenDto,
  ) {
    const validated = await this.invitationsService.validateToken(dto.token);
    if (!validated)
      throw new BadRequestException('Invitation token is invalid, expired, or has been revoked');

    const { payload, tokenHash } = validated;
    if (payload.agencyId !== dto.agencyId)
      throw new BadRequestException('Token does not match the provided agency');

    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive) throw new ForbiddenException('User not found or inactive');

    if (actor.email.toLowerCase() !== payload.inviteeEmail.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    const invite = await this.agencyRepo.getInvitationByTokenHash(tokenHash);
    if (!invite || invite.status !== 'pending')
      throw new BadRequestException('Invitation is no longer pending');

    await Promise.all([
      this.agencyRepo.declineInvitation(invite.id),
      this.invitationsService.deleteTokenFromRedis(tokenHash),
    ]);

    return { ok: true };
  }

  /**
   * POST /agencies/:agencyId/invites/:inviteId/resend
   * Rotate token, refresh Redis + DB, resend email.
   */
  @Post(':agencyId/invites/:inviteId/resend')
  async resendInvite(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Param('inviteId') inviteId: string,
  ) {
    const [actor, membership] = await Promise.all([
      this.agencyRepo.findUserById(session.user.id),
      this.agencyRepo.getMembership(agencyId, session.user.id),
    ]);
    requireAgencyOwnerOrAdmin(
      { id: actor!.id, platformRole: actor!.platformRole },
      membership ?? undefined,
    );

    const [invite, agency] = await Promise.all([
      this.agencyRepo.getInvitation(inviteId),
      this.agencyRepo.getAgencyById(agencyId),
    ]);

    if (!invite || invite.agencyId !== agencyId)
      throw new NotFoundException('Invitation not found');
    if (!agency) throw new NotFoundException('Agency not found');
    if (invite.status === 'accepted') throw new BadRequestException('Invitation already accepted');
    if (invite.status === 'declined')
      throw new BadRequestException('Invitation was declined. Delete and re-invite.');

    const recipientEmail = invite.inviteeEmail ?? null;
    if (!recipientEmail)
      throw new BadRequestException('Cannot resend: no email associated with this invitation');

    // Revoke old token from Redis if it exists
    if (invite.tokenHash) {
      await this.invitationsService.deleteTokenFromRedis(invite.tokenHash);
    }

    // Generate new token
    const newExpiresAt = this.invitationsService.expiresAt();
    const rawToken = this.invitationsService.generateToken();
    const newTokenHash = this.invitationsService.hashToken(rawToken);

    // Update DB + Redis in parallel
    const [updatedInvite] = await Promise.all([
      this.agencyRepo.rotateInvitationToken(inviteId, newTokenHash, newExpiresAt),
      this.invitationsService.storeTokenInRedis(newTokenHash, {
        inviteId,
        agencyId,
        inviteeEmail: recipientEmail,
      }),
    ]);

    // Send email
    await this.invitationsService.sendInvitationEmail({
      to: recipientEmail,
      agencyName: agency.name,
      inviterName: actor!.name,
      role: invite.role,
      token: rawToken,
      agencyId,
    });

    return { ok: true, invite: updatedInvite };
  }

  /**
   * POST /agencies/:agencyId/invites/:inviteId/revoke
   * Delete token from Redis + clear in DB. Row stays.
   */
  @Post(':agencyId/invites/:inviteId/revoke')
  async revokeInvite(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Param('inviteId') inviteId: string,
  ) {
    const [actor, membership] = await Promise.all([
      this.agencyRepo.findUserById(session.user.id),
      this.agencyRepo.getMembership(agencyId, session.user.id),
    ]);
    requireAgencyOwnerOrAdmin(
      { id: actor!.id, platformRole: actor!.platformRole },
      membership ?? undefined,
    );

    const invite = await this.agencyRepo.getInvitation(inviteId);
    if (!invite || invite.agencyId !== agencyId)
      throw new NotFoundException('Invitation not found');
    if (invite.status !== 'pending')
      throw new BadRequestException('Only pending invitations can be revoked');
    if (!invite.tokenHash) throw new BadRequestException('No active token to revoke');

    await this.invitationsService.revokeToken(invite.tokenHash);
    return { ok: true };
  }

  /**
   * DELETE /agencies/:agencyId/invites/:inviteId
   * Hard delete the invitation row.
   */
  @Delete(':agencyId/invites/:inviteId')
  async deleteInvite(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Param('inviteId') inviteId: string,
  ) {
    const [actor, membership] = await Promise.all([
      this.agencyRepo.findUserById(session.user.id),
      this.agencyRepo.getMembership(agencyId, session.user.id),
    ]);
    requireAgencyOwnerOrAdmin(
      { id: actor!.id, platformRole: actor!.platformRole },
      membership ?? undefined,
    );

    const invite = await this.agencyRepo.getInvitation(inviteId);
    if (!invite || invite.agencyId !== agencyId)
      throw new NotFoundException('Invitation not found');

    // If active token exists, revoke from Redis first
    if (invite.tokenHash) {
      await this.invitationsService.deleteTokenFromRedis(invite.tokenHash);
    }

    await this.agencyRepo.deleteInvitation(inviteId);
    return { ok: true };
  }

  // ─── Followers ────────────────────────────────────────────────────────────

  @Post(':agencyId/follow')
  async followAgency(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    await this.agencyRepo.followAgency(agencyId, session.user.id);
    return { ok: true };
  }

  @Delete(':agencyId/follow')
  async unfollowAgency(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    await this.agencyRepo.unfollowAgency(agencyId, session.user.id);
    return { ok: true };
  }
}
