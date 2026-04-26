import {
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
import { CommandBus } from '@nestjs/cqrs';
import { Session, type UserSession, AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';

import { DI } from '@app/di.tokens';
import { API_OPERATIONS, API_RESPONSES, API_HEADERS } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import { z } from 'zod';

import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import { ChangeListingStatusCommand } from '@modules/listing-management/application/commands/change-listing-status.command';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import type { ListingStatus } from '@modules/listing-management/domain/listing-status';
import { DrizzleAgencyRepository } from '@modules/identity-access/agencies/infrastructure/drizzle-agency.repository';
import {
  canPostForAgency,
  isPlatformAdmin,
} from '@modules/identity-access/agencies/presentation/agency-authz';
import type { CreateListingDto } from '@modules/listing-management/presentation/dto/create-listing.dto';
import type { ChangeListingStatusDto } from '@modules/listing-management/presentation/dto/change-listing-status.dto';
import type { DeleteListingDto } from '@modules/listing-management/presentation/dto/delete-listing.dto';
import type { UpdateListingDto } from '@modules/listing-management/presentation/dto/update-listing.dto';
import { changeListingStatusSchema } from '@modules/listing-management/presentation/dto/change-listing-status.dto';
import { createListingSchema } from '@modules/listing-management/presentation/dto/create-listing.dto';
import { updateListingSchema } from '@modules/listing-management/presentation/dto/update-listing.dto';
import { deleteListingSchema } from '@modules/listing-management/presentation/dto/delete-listing.dto';

const listingStatuses = ['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'DELETED'] as const;
const listingQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1)),
  perPage: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  q: z.string().trim().max(160).optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return [] as string[];
      return Array.isArray(value) ? value : [value];
    })
    .pipe(z.array(z.enum(listingStatuses)).optional()),
});

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(DI.ListingRepository) private readonly listingRepo: ListingRepository,
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
  ) {}

  @Get('me')
  @ApiOperation(API_OPERATIONS.GET_MY_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async mine(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(listingQuerySchema))
    q: {
      page: number;
      perPage: number;
      q?: string;
      status?: ListingStatus[];
    },
  ) {
    const result = await this.listingRepo.listByOwner({
      ownerId: session.user.id,
      page: q.page,
      perPage: q.perPage,
      q: q.q,
      statuses: q.status,
    });

    return {
      items: result.items.map((x) => x.snapshot),
      page: q.page,
      perPage: q.perPage,
      total: result.total,
      q: q.q ?? '',
      status: q.status ?? [],
    };
  }

  @Get('agency/:agencyId')
  @ApiOperation({ summary: 'List listings by agency' })
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async listByAgency(
    @Session() session: UserSession,
    @Param('agencyId') agencyId: string,
    @Query(new ZodValidationPipe(listingQuerySchema))
    q: {
      page: number;
      perPage: number;
      q?: string;
      status?: ListingStatus[];
    },
  ) {
    const actor = await this.agencyRepo.findUserById(session.user.id);
    if (!actor) throw new ForbiddenException('User not found');

    const membership = await this.agencyRepo.getMembership(agencyId, session.user.id);

    // Enforce access: admin or active agency member only
    if (actor.platformRole !== 'admin' && (!membership || membership.status !== 'active')) {
      throw new ForbiddenException('You do not have access to this agency listings');
    }

    const result = await this.listingRepo.listByAgency({
      agencyId,
      page: q.page,
      perPage: q.perPage,
      q: q.q,
      statuses: q.status,
    });

    return {
      items: result.items.map((x) => x.snapshot),
      page: q.page,
      perPage: q.perPage,
      total: result.total,
      q: q.q ?? '',
      status: q.status ?? [],
    };
  }

  @Get('admin')
  @ApiOperation(API_OPERATIONS.GET_ADMIN_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async adminList(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(listingQuerySchema))
    q: {
      page: number;
      perPage: number;
      q?: string;
      status?: ListingStatus[];
    },
  ) {
    await this.assertAdmin(session.user.id);

    const result = await this.listingRepo.listAll({
      page: q.page,
      perPage: q.perPage,
      q: q.q,
      statuses: q.status,
    });

    return {
      items: result.items.map((x) => x.snapshot),
      page: q.page,
      perPage: q.perPage,
      total: result.total,
      q: q.q ?? '',
      status: q.status ?? [],
    };
  }

  @Get(':id')
  @ApiOperation(API_OPERATIONS.GET_LISTING_BY_ID)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listing'))
  @ApiResponse(API_RESPONSES.NOT_FOUND('Listing'))
  @AllowAnonymous()
  async byId(@Param('id') id: string) {
    const listing = await this.listingRepo.findById(id);
    if (!listing || listing.snapshot.status !== 'PUBLISHED') {
      throw new NotFoundException('Listing not found');
    }

    return { item: listing.snapshot };
  }

  @Post()
  @ApiOperation(API_OPERATIONS.CREATE_LISTING)
  @ApiResponse(API_RESPONSES.CREATED('Listing'))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED('admin or agent'))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async create(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(createListingSchema)) dto: CreateListingDto,
  ) {
    const result: { id: string } = await this.commandBus.execute(
      new CreateListingCommand({
        ...dto,
        actorUserId: session.user.id,
        ownerId: session.user.id,
      }),
    );
    return result;
  }

  @Patch()
  @ApiOperation(API_OPERATIONS.UPDATE_LISTING)
  @ApiResponse(API_RESPONSES.UPDATED('Listing'))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED('admin or agent'))
  @ApiResponse(API_RESPONSES.NOT_FOUND('Listing'))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async update(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(updateListingSchema)) dto: UpdateListingDto,
  ) {
    await this.commandBus.execute(
      new UpdateListingCommand({ ...dto, actorUserId: session.user.id }),
    );
    return { ok: true };
  }

  @Patch(':id/status')
  @ApiOperation(API_OPERATIONS.UPDATE_LISTING_STATUS)
  @ApiResponse(API_RESPONSES.UPDATED('Listing'))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED('admin or agent'))
  @ApiResponse(API_RESPONSES.NOT_FOUND('Listing'))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async updateStatus(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(changeListingStatusSchema)) dto: ChangeListingStatusDto,
  ) {
    await this.commandBus.execute(
      new ChangeListingStatusCommand({
        id,
        actorUserId: session.user.id,
        status: dto.status,
      }),
    );
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation(API_OPERATIONS.DELETE_LISTING)
  @ApiResponse(API_RESPONSES.DELETED('Listing'))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED('admin or agent'))
  @ApiResponse(API_RESPONSES.NOT_FOUND('Listing'))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async delete(@Session() session: UserSession, @Param('id') id: string) {
    await this.commandBus.execute(new DeleteListingCommand({ id, actorUserId: session.user.id }));
    return { ok: true };
  }

  @Delete()
  @ApiOperation(API_OPERATIONS.DELETE_LISTING)
  @ApiResponse(API_RESPONSES.DELETED('Listing'))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED('admin or agent'))
  @ApiResponse(API_RESPONSES.NOT_FOUND('Listing'))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async deleteLegacy(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(deleteListingSchema)) dto: DeleteListingDto,
  ) {
    await this.commandBus.execute(
      new DeleteListingCommand({ ...dto, actorUserId: session.user.id }),
    );
    return { ok: true };
  }

  private async assertAdmin(actorUserId: string) {
    const actor = await this.agencyRepo.findUserById(actorUserId);
    if (!actor || !isPlatformAdmin({ id: actor.id, platformRole: actor.platformRole })) {
      throw new ForbiddenException('Admin access is required');
    }
  }

  private async assertCanManageListing(
    actorUserId: string,
    listing: {
      ownerId: string;
      createdByUserId?: string;
      agencyId?: string | null;
    },
  ) {
    const actor = await this.agencyRepo.findUserById(actorUserId);
    if (!actor) {
      throw new ForbiddenException('User not found');
    }

    if (isPlatformAdmin({ id: actor.id, platformRole: actor.platformRole })) {
      return;
    }

    if (
      listing.ownerId === actorUserId ||
      (listing.createdByUserId && listing.createdByUserId === actorUserId)
    ) {
      return;
    }

    if (listing.agencyId) {
      const membership = await this.agencyRepo.getMembership(listing.agencyId, actorUserId);
      if (
        canPostForAgency(
          { id: actor.id, platformRole: actor.platformRole },
          membership ?? undefined,
        )
      ) {
        return;
      }
    }

    throw new ForbiddenException('You are not allowed to access this listing');
  }
}
