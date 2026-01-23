import { Body, Controller, Delete, Patch, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Roles } from '@thallesp/nestjs-better-auth';

import { ROLES } from '@shared/auth/roles';

import { CreateListingCommand } from '../application/commands/create-listing.command';
import { DeleteListingCommand } from '../application/commands/delete-listing.command';
import { UpdateListingCommand } from '../application/commands/update-listing.command';
import { CreateListingDto } from './dto/create-listing.dto';
import { DeleteListingDto } from './dto/delete-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

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
