import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { DI } from "@app/di.tokens";
import { Listing } from "@modules/listing-management/domain/listing.aggregate";
import { UpdateListingCommand } from "@modules/listing-management/application/commands/update-listing.command";
import type { ListingRepository } from "@modules/listing-management/application/ports/listing.repository";
import type { ListingEventsPublisher } from "@modules/listing-management/application/ports/listing-events.publisher";

@CommandHandler(UpdateListingCommand)
export class UpdateListingHandler implements ICommandHandler<UpdateListingCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
  ) {}

  async execute(command: UpdateListingCommand): Promise<void> {
    const priceAmountStr = command.payload.priceAmount?.toString() ?? undefined;

    // Minimal "rehydrate" for now (we'll replace with repo.getById later)
    const listing = Listing.create({
      id: command.payload.id,
      ownerId: command.payload.ownerId,
      title: command.payload.title ?? "(unchanged)",
      description: command.payload.description,
      priceAmount: priceAmountStr ?? "0",
      currency: command.payload.currency ?? "PKR",
      propertyType: command.payload.propertyType,
      status: command.payload.status ?? "DRAFT",
    });

    listing.update({
      title: command.payload.title,
      description: command.payload.description,
      priceAmount: priceAmountStr,
      currency: command.payload.currency,
      propertyType: command.payload.propertyType,
      status: command.payload.status,
    });

    await this.repo.update(listing);
    await this.publisher.publish(listing.pullDomainEvents());
  }
}
