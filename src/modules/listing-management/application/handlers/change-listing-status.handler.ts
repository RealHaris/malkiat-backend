import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DI } from '@app/di.tokens';
import { ChangeListingStatusCommand } from '@modules/listing-management/application/commands/change-listing-status.command';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingStatus } from '@modules/listing-management/domain/listing-status';
import { DrizzleAgencyRepository } from '@modules/identity-access/agencies/infrastructure/drizzle-agency.repository';
import {
  canPostForAgency,
  isPlatformAdmin,
} from '@modules/identity-access/agencies/presentation/agency-authz';

@CommandHandler(ChangeListingStatusCommand)
export class ChangeListingStatusHandler implements ICommandHandler<ChangeListingStatusCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
  ) {}

  async execute(command: ChangeListingStatusCommand): Promise<void> {
    const listing = await this.repo.findById(command.payload.id);
    if (!listing) throw new NotFoundException('Listing not found');

    const actor = await this.agencyRepo.findUserById(command.payload.actorUserId);
    if (!actor) throw new ForbiddenException('User not found');

    const actorIsAdmin = isPlatformAdmin({ id: actor.id, platformRole: actor.platformRole });
    const actorOwnsListing =
      (listing.snapshot.createdByUserId ?? listing.snapshot.ownerId) ===
        command.payload.actorUserId || listing.snapshot.ownerId === command.payload.actorUserId;

    let actorCanManageAgencyListing = false;
    if (listing.snapshot.agencyId) {
      const membership = await this.agencyRepo.getMembership(
        listing.snapshot.agencyId,
        command.payload.actorUserId,
      );
      actorCanManageAgencyListing = canPostForAgency(
        { id: actor.id, platformRole: actor.platformRole },
        membership ?? undefined,
      );
    }

    if (!actorIsAdmin && !actorOwnsListing && !actorCanManageAgencyListing) {
      throw new ForbiddenException('You are not allowed to update this listing status');
    }

    this.assertTransitionAllowed({
      currentStatus: listing.snapshot.status,
      nextStatus: command.payload.status,
      actorIsAdmin,
    });

    listing.update({
      status: command.payload.status,
      publishedAt:
        command.payload.status === 'PUBLISHED'
          ? (listing.snapshot.publishedAt ?? new Date())
          : null,
    });

    await this.repo.update(listing);
    await this.publisher.publish(listing.pullDomainEvents());
  }

  private assertTransitionAllowed(input: {
    currentStatus: ListingStatus;
    nextStatus: ListingStatus;
    actorIsAdmin: boolean;
  }) {
    const { currentStatus, nextStatus, actorIsAdmin } = input;

    if (currentStatus === nextStatus) {
      return;
    }

    if (nextStatus === 'DELETED') {
      if (!actorIsAdmin && currentStatus === 'PUBLISHED') {
        throw new ForbiddenException('Only admin can delete a published listing');
      }
      return;
    }

    if (nextStatus === 'PUBLISHED' || nextStatus === 'UNPUBLISHED') {
      if (!actorIsAdmin) {
        throw new ForbiddenException('Only admin can publish or unpublish listings');
      }
      return;
    }

    if (nextStatus === 'UNDER_REVIEW' || nextStatus === 'DRAFT') {
      if ((currentStatus === 'PUBLISHED' || currentStatus === 'UNPUBLISHED') && !actorIsAdmin) {
        throw new ForbiddenException(
          'Only admin can change the status of a published or unpublished listing',
        );
      }
    }
  }
}
