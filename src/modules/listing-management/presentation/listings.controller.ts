import { Body, Controller, Delete, Patch, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Roles } from "@thallesp/nestjs-better-auth";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { ROLES } from "@shared/auth/roles";

import { CreateListingCommand } from "@modules/listing-management/application/commands/create-listing.command";
import { DeleteListingCommand } from "@modules/listing-management/application/commands/delete-listing.command";
import { UpdateListingCommand } from "@modules/listing-management/application/commands/update-listing.command";
import { CreateListingDto } from "@modules/listing-management/presentation/dto/create-listing.dto";
import { DeleteListingDto } from "@modules/listing-management/presentation/dto/delete-listing.dto";
import { UpdateListingDto } from "@modules/listing-management/presentation/dto/update-listing.dto";

@ApiTags("listings")
@Controller("listings")
@Roles([ROLES.ADMIN, ROLES.AGENT])
export class ListingsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: "Create a new listing" })
  @ApiResponse({ status: 201, description: "Listing created successfully" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - requires admin or agent role",
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiHeader({
    name: "Authorization",
    description: "Session token",
    required: true,
  })
  async create(@Body() dto: CreateListingDto) {
    const result: { id: string } = await this.commandBus.execute(new CreateListingCommand(dto));
    return result;
  }

  @Patch()
  @ApiOperation({ summary: "Update an existing listing" })
  @ApiResponse({ status: 200, description: "Listing updated successfully" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - requires admin or agent role",
  })
  @ApiResponse({ status: 404, description: "Listing not found" })
  @ApiHeader({
    name: "Authorization",
    description: "Session token",
    required: true,
  })
  async update(@Body() dto: UpdateListingDto) {
    await this.commandBus.execute(new UpdateListingCommand(dto));
    return { ok: true };
  }

  @Delete()
  @ApiOperation({ summary: "Delete a listing" })
  @ApiResponse({ status: 200, description: "Listing deleted successfully" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - requires admin or agent role",
  })
  @ApiResponse({ status: 404, description: "Listing not found" })
  @ApiHeader({
    name: "Authorization",
    description: "Session token",
    required: true,
  })
  async delete(@Body() dto: DeleteListingDto) {
    await this.commandBus.execute(new DeleteListingCommand(dto));
    return { ok: true };
  }
}
