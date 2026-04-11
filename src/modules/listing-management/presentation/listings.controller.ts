import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';

import { DI } from '@app/di.tokens';
import { API_OPERATIONS, API_RESPONSES, API_HEADERS } from '@shared/constants/api.constants';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import { z } from 'zod';

import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import type { CreateListingDto } from '@modules/listing-management/presentation/dto/create-listing.dto';
import type { DeleteListingDto } from '@modules/listing-management/presentation/dto/delete-listing.dto';
import type { UpdateListingDto } from '@modules/listing-management/presentation/dto/update-listing.dto';
import { createListingSchema } from '@modules/listing-management/presentation/dto/create-listing.dto';
import { updateListingSchema } from '@modules/listing-management/presentation/dto/update-listing.dto';
import { deleteListingSchema } from '@modules/listing-management/presentation/dto/delete-listing.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(DI.ListingRepository) private readonly listingRepo: ListingRepository,
  ) {}

  @Get('me')
  @ApiOperation(API_OPERATIONS.GET_MY_LISTINGS)
  @ApiResponse(API_RESPONSES.RETRIEVED('Listings'))
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async mine(
    @Session() session: UserSession,
    @Query(
      new ZodValidationPipe(
        z.object({
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
        }),
      ),
    )
    q: { page: number; perPage: number },
  ) {
    const result = await this.listingRepo.listByOwner({
      ownerId: session.user.id,
      page: q.page,
      perPage: q.perPage,
    });

    return {
      items: result.items.map((x) => x.snapshot),
      page: q.page,
      perPage: q.perPage,
      total: result.total,
    };
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
    await this.commandBus.execute(new UpdateListingCommand({ ...dto, actorUserId: session.user.id }));
    return { ok: true };
  }

  @Delete()
  @ApiOperation(API_OPERATIONS.DELETE_LISTING)
  @ApiResponse(API_RESPONSES.DELETED('Listing'))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED('admin or agent'))
  @ApiResponse(API_RESPONSES.NOT_FOUND('Listing'))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async delete(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(deleteListingSchema)) dto: DeleteListingDto,
  ) {
    await this.commandBus.execute(new DeleteListingCommand({ ...dto, actorUserId: session.user.id }));
    return { ok: true };
  }
}
