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
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { DI } from '@app/di.tokens';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { DrizzleAgencyRepository } from '../infrastructure/drizzle-agency.repository';
import { addAgencyMembersSchema, type AddAgencyMembersDto } from './dto/add-agency-members.dto';
import { createAgencySchema, type CreateAgencyDto } from './dto/create-agency.dto';
import { updateAgencyMemberSchema, type UpdateAgencyMemberDto } from './dto/update-agency-member.dto';
import { updateAgencySchema, type UpdateAgencyDto } from './dto/update-agency.dto';
import { requireAgencyOwnerOrAdmin, canPostForAgency } from './agency-authz';

@Controller('agencies')
export class AgenciesController {
  constructor(
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
  ) {}

  @Post()
  async create(@Session() session: UserSession, @Body(new ZodValidationPipe(createAgencySchema)) dto: CreateAgencyDto) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive) {
      throw new ForbiddenException('Inactive users cannot create agencies');
    }

    const agency = await this.agencyRepo.createAgency({
      name: dto.name,
      description: dto.description,
      logoUrl: dto.logoUrl,
      ownerUserId: session.user.id,
      createdByUserId: session.user.id,
    });

    return { agency };
  }

  @Get(':agencyId')
  async getAgency(@Param('agencyId') agencyId: string) {
    const agency = await this.agencyRepo.getAgencyById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');
    return { agency };
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
    requireAgencyOwnerOrAdmin({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined);

    const updated = await this.agencyRepo.updateAgency(agencyId, {
      name: dto.name,
      description: dto.description,
      logoUrl: dto.logoUrl,
    });

    if (!updated) throw new NotFoundException('Agency not found');
    return { agency: updated };
  }

  @Post(':agencyId/archive')
  async archiveAgency(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    requireAgencyOwnerOrAdmin({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined);

    const archived = await this.agencyRepo.archiveAgency(agencyId);
    if (!archived) throw new NotFoundException('Agency not found');
    return { agency: archived };
  }

  @Get(':agencyId/members')
  async listMembers(@Session() session: UserSession, @Param('agencyId') agencyId: string) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    if (!canPostForAgency({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined)) {
      throw new ForbiddenException('You are not allowed to view agency members');
    }

    const members = await this.agencyRepo.listMembers(agencyId);
    return { members };
  }

  @Get('me/list')
  async listMyAgencies(@Session() session: UserSession) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor || !actor.isActive) {
      throw new ForbiddenException('Inactive users cannot access agencies');
    }

    const agencies = await this.agencyRepo.listActiveAgenciesForUser(session.user.id);
    return { agencies };
  }

  @Post(':agencyId/members')
  async addMembers(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Body(new ZodValidationPipe(addAgencyMembersSchema)) dto: AddAgencyMembersDto,
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    requireAgencyOwnerOrAdmin({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined);

    const uniqueUserIds = [...new Set(dto.members.map((m) => m.userId))];
    const existingUsers = await this.agencyRepo.usersExist(uniqueUserIds);
    if (existingUsers.length !== uniqueUserIds.length) {
      throw new BadRequestException('One or more users do not exist or are inactive');
    }

    await this.agencyRepo.addOrUpdateMembers(
      agencyId,
      dto.members.map((m) => ({ userId: m.userId, membershipRole: m.membershipRole })),
    );

    return { ok: true };
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

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    requireAgencyOwnerOrAdmin({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined);

    const targetMembership = await this.agencyRepo.getMembership(agencyId, userId);
    if (!targetMembership) throw new NotFoundException('Agency member not found');

    if (targetMembership.membershipRole === 'owner' && dto.membershipRole === 'agent') {
      const ownerCount = await this.agencyRepo.countActiveOwners(agencyId);
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the last active owner');
      }
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

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);
    requireAgencyOwnerOrAdmin({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined);

    const targetMembership = await this.agencyRepo.getMembership(agencyId, userId);
    if (!targetMembership) throw new NotFoundException('Agency member not found');

    if (targetMembership.membershipRole === 'owner') {
      const ownerCount = await this.agencyRepo.countActiveOwners(agencyId);
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last active owner');
      }
    }

    const removed = await this.agencyRepo.removeMember(agencyId, userId);
    return { member: removed };
  }
}
