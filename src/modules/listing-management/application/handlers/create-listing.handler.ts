import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { DI } from "@app/di.tokens";
import { Listing } from "@modules/listing-management/domain/listing.aggregate";
import { CreateListingCommand } from "@modules/listing-management/application/commands/create-listing.command";
import type { ListingRepository } from "@modules/listing-management/application/ports/listing.repository";
import type { ListingEventsPublisher } from "@modules/listing-management/application/ports/listing-events.publisher";

@CommandHandler(CreateListingCommand)
export class CreateListingHandler implements ICommandHandler<CreateListingCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
  ) {}

  async execute(command: CreateListingCommand): Promise<{ id: string }> {
    const listing = Listing.create({
      id: command.payload.id,
      ownerId: command.payload.ownerId,
      title: command.payload.title,
      description: command.payload.description,
      priceAmount: command.payload.priceAmount,
      currency: command.payload.currency ?? "PKR",
      propertyType: command.payload.propertyType,
      status: "DRAFT",
    });

    await this.repo.create(listing);
    await this.publisher.publish(listing.pullDomainEvents());

    return { id: listing.snapshot.id };
  }
}
