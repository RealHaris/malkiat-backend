import { Body, Controller, Delete, Patch, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Roles } from '@thallesp/nestjs-better-auth';

import { ROLES } from '@shared/auth/roles';

import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import { CreateListingDto } from '@modules/listing-management/presentation/dto/create-listing.dto';
import { DeleteListingDto } from '@modules/listing-management/presentation/dto/delete-listing.dto';
import { UpdateListingDto } from '@modules/listing-management/presentation/dto/update-listing.dto';

@Controller('listings')
@Roles([ROLES.ADMIN, ROLES.AGENT])
export class ListingsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: CreateListingDto) {
    const result: { id: string } = await this.commandBus.execute(
      new CreateListingCommand(dto),
    );
    return result;
  }

  @Patch()
  async update(@Body() dto: UpdateListingDto) {
    await this.commandBus.execute(new UpdateListingCommand(dto));
    return { ok: true };
  }

  @Delete()
  async delete(@Body() dto: DeleteListingDto) {
    await this.commandBus.execute(new DeleteListingCommand(dto));
    return { ok: true };
  }
}
