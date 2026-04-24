import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DI } from '@app/di.tokens';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import { DrizzleAgencyRepository } from '@modules/identity-access/agencies/infrastructure/drizzle-agency.repository';
import {
  canPostForAgency,
  isPlatformAdmin,
} from '@modules/identity-access/agencies/presentation/agency-authz';

@CommandHandler(DeleteListingCommand)
export class DeleteListingHandler implements ICommandHandler<DeleteListingCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
  ) {}

  async execute(command: DeleteListingCommand): Promise<void> {
    const actorUserId = command.payload.actorUserId ?? command.payload.ownerId;

    const listing = await this.repo.findById(command.payload.id);
    if (!listing) throw new NotFoundException('Listing not found');

    if (!actorUserId) throw new ForbiddenException('User not found');

    const actor = await this.agencyRepo.findUserById(actorUserId);
    if (!actor) throw new ForbiddenException('User not found');

    const actorIsAdmin = isPlatformAdmin({ id: actor.id, platformRole: actor.platformRole });
    const actorOwnsListing =
      (listing.snapshot.createdByUserId ?? listing.snapshot.ownerId) === actorUserId ||
      listing.snapshot.ownerId === actorUserId;

    let actorCanManageAgencyListing = false;
    if (listing.snapshot.agencyId) {
      const membership = await this.agencyRepo.getMembership(
        listing.snapshot.agencyId,
        actorUserId,
      );
      actorCanManageAgencyListing = canPostForAgency(
        { id: actor.id, platformRole: actor.platformRole },
        membership ?? undefined,
      );
    }

    if (!actorIsAdmin && !actorOwnsListing && !actorCanManageAgencyListing) {
      throw new ForbiddenException('You are not allowed to delete this listing');
    }

    if (!actorIsAdmin && listing.snapshot.status === 'PUBLISHED') {
      throw new ForbiddenException('Only admin can delete a published listing');
    }

    listing.update({ status: 'DELETED', publishedAt: null });

    await this.repo.update(listing);
    await this.publisher.publish(listing.pullDomainEvents());
  }
}
