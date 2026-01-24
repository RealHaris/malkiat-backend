import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DI } from '@app/di.tokens';
import { Listing } from '../../domain/listing.aggregate';
import { DeleteListingCommand } from '../commands/delete-listing.command';
import type { ListingRepository } from '../ports/listing.repository';
import type { ListingEventsPublisher } from '../ports/listing-events.publisher';

@CommandHandler(DeleteListingCommand)
export class DeleteListingHandler implements ICommandHandler<DeleteListingCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
  ) {}

  async execute(command: DeleteListingCommand): Promise<void> {
    const listing = Listing.create({
      id: command.payload.id,
      ownerId: command.payload.ownerId,
      title: '(deleted)',
      priceAmount: '0',
      currency: 'PKR',
      status: 'DRAFT',
    });

    listing.markDeleted();

    await this.repo.deleteById(command.payload.id);
    await this.publisher.publish(listing.pullDomainEvents());
  }
}
