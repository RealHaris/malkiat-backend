import { Body, Controller, Delete, Patch, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Roles } from "@thallesp/nestjs-better-auth";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { ROLES } from "@shared/auth/roles";
import { API_OPERATIONS, API_RESPONSES, API_HEADERS } from "@shared/constants/api.constants";
import { ZodValidationPipe } from "@shared/pipes/zod-validation.pipe";

import { CreateListingCommand } from "@modules/listing-management/application/commands/create-listing.command";
import { DeleteListingCommand } from "@modules/listing-management/application/commands/delete-listing.command";
import { UpdateListingCommand } from "@modules/listing-management/application/commands/update-listing.command";
import type { CreateListingDto } from "@modules/listing-management/presentation/dto/create-listing.dto";
import type { DeleteListingDto } from "@modules/listing-management/presentation/dto/delete-listing.dto";
import type { UpdateListingDto } from "@modules/listing-management/presentation/dto/update-listing.dto";
import { createListingSchema } from "@modules/listing-management/presentation/dto/create-listing.dto";
import { updateListingSchema } from "@modules/listing-management/presentation/dto/update-listing.dto";
import { deleteListingSchema } from "@modules/listing-management/presentation/dto/delete-listing.dto";

@ApiTags("listings")
@Controller("listings")
@Roles([ROLES.ADMIN, ROLES.AGENT])
export class ListingsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation(API_OPERATIONS.CREATE_LISTING)
  @ApiResponse(API_RESPONSES.CREATED("Listing"))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED("admin or agent"))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async create(@Body(new ZodValidationPipe(createListingSchema)) dto: CreateListingDto) {
    const result: { id: string } = await this.commandBus.execute(new CreateListingCommand(dto));
    return result;
  }

  @Patch()
  @ApiOperation(API_OPERATIONS.UPDATE_LISTING)
  @ApiResponse(API_RESPONSES.UPDATED("Listing"))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED("admin or agent"))
  @ApiResponse(API_RESPONSES.NOT_FOUND("Listing"))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async update(@Body(new ZodValidationPipe(updateListingSchema)) dto: UpdateListingDto) {
    await this.commandBus.execute(new UpdateListingCommand(dto));
    return { ok: true };
  }

  @Delete()
  @ApiOperation(API_OPERATIONS.DELETE_LISTING)
  @ApiResponse(API_RESPONSES.DELETED("Listing"))
  @ApiResponse(API_RESPONSES.UNAUTHORIZED("admin or agent"))
  @ApiResponse(API_RESPONSES.NOT_FOUND("Listing"))
  @ApiResponse(API_RESPONSES.VALIDATION_ERROR)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  async delete(@Body(new ZodValidationPipe(deleteListingSchema)) dto: DeleteListingDto) {
    await this.commandBus.execute(new DeleteListingCommand(dto));
    return { ok: true };
  }
}
