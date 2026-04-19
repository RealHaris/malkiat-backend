import { BadRequestException, ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import { DI } from '@app/di.tokens';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import { areas, propertySubtypes, toSqft } from '@infra/db/drizzle/schema';
import { DrizzleAgencyRepository } from '@modules/identity-access/agencies/infrastructure/drizzle-agency.repository';
import { canPostForAgency, isPlatformAdmin } from '@modules/identity-access/agencies/presentation/agency-authz';

@CommandHandler(UpdateListingCommand)
export class UpdateListingHandler implements ICommandHandler<UpdateListingCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
    @Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>,
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
  ) {}

  async execute(command: UpdateListingCommand): Promise<void> {
    const actorUserId = command.payload.actorUserId ?? command.payload.ownerId;
    if (!actorUserId) throw new ForbiddenException('User not found');

    const listing = await this.repo.findById(command.payload.id);
    if (!listing) throw new NotFoundException('Listing not found');

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
      throw new ForbiddenException('You are not allowed to update this listing');
    }

    if (typeof command.payload.agencyId !== 'undefined') {
      if (command.payload.agencyId) {
        const agency = await this.agencyRepo.getAgencyById(command.payload.agencyId);
        if (!agency) {
          throw new BadRequestException('Agency not found');
        }
        const membership = await this.agencyRepo.getMembership(
          command.payload.agencyId,
          actorUserId,
        );
        if (!canPostForAgency({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined)) {
          throw new ForbiddenException('You cannot assign this listing to the selected agency');
        }
      } else if (!actorIsAdmin && !actorOwnsListing) {
        throw new ForbiddenException('Only admin or listing creator can remove agency tag');
      }
    }

    if (command.payload.city && command.payload.city !== 'Karachi') {
      throw new BadRequestException('City must be Karachi');
    }

    if (command.payload.propertySubtypeId) {
      const [subtype] = await this.db
        .select({ id: propertySubtypes.id, category: propertySubtypes.category })
        .from(propertySubtypes)
        .where(eq(propertySubtypes.id, command.payload.propertySubtypeId))
        .limit(1);
      if (!subtype) throw new BadRequestException('Invalid property subtype ID');

      const selectedCategory = command.payload.propertyCategory ?? listing.snapshot.propertyCategory;
      if (subtype.category !== selectedCategory) {
        throw new BadRequestException('Property subtype does not belong to selected category');
      }
    }

    if (command.payload.areaId) {
      const [area] = await this.db
        .select({ id: areas.id, city: areas.city, isActive: areas.isActive })
        .from(areas)
        .where(eq(areas.id, command.payload.areaId))
        .limit(1);
      if (!area || !area.isActive || area.city !== 'Karachi') {
        throw new BadRequestException('Invalid area ID for Karachi');
      }
    }

    const priceAmountStr = command.payload.priceAmount?.toString() ?? undefined;
    const areaValueStr = command.payload.areaValue?.toString() ?? undefined;
    const effectiveAreaValue = command.payload.areaValue ?? Number(listing.snapshot.areaValue);
    const effectiveAreaUnit = command.payload.areaUnit ?? listing.snapshot.areaUnit;
    const shouldRecomputeAreaSqft =
      typeof command.payload.areaValue === 'number' || typeof command.payload.areaUnit === 'string';
    const areaSqftStr = shouldRecomputeAreaSqft
      ? toSqft(effectiveAreaValue, effectiveAreaUnit).toString()
      : undefined;

    const publishedAt =
      command.payload.status === 'PUBLISHED'
        ? listing.snapshot.publishedAt ?? new Date()
        : command.payload.status === 'DRAFT' ||
            command.payload.status === 'UNDER_REVIEW' ||
            command.payload.status === 'ARCHIVED'
          ? null
          : undefined;

    listing.update({
      title: command.payload.title,
      agencyId: command.payload.agencyId,
      description: command.payload.description,
      purpose: command.payload.purpose,
      propertyCategory: command.payload.propertyCategory,
      propertySubtypeId: command.payload.propertySubtypeId,
      city: command.payload.city,
      areaId: command.payload.areaId,
      locationText: command.payload.locationText,
      latitude: typeof command.payload.latitude === 'number' ? command.payload.latitude.toString() : undefined,
      longitude:
        typeof command.payload.longitude === 'number' ? command.payload.longitude.toString() : undefined,
      areaValue: areaValueStr,
      areaUnit: command.payload.areaUnit,
      areaSqft: areaSqftStr,
      priceAmount: priceAmountStr,
      currency: command.payload.currency,
      installmentAvailable: command.payload.installmentAvailable,
      readyForPossession: command.payload.readyForPossession,
      bedroomsCount: command.payload.bedroomsCount,
      bathroomsCount: command.payload.bathroomsCount,
      amenityIds: command.payload.amenityIds,
      imagesJson: command.payload.imagesJson,
      videoUrl: command.payload.videoUrl,
      platforms: command.payload.platforms,
      status: command.payload.status,
      publishedAt,
    });

    await this.repo.update(listing);
    await this.publisher.publish(listing.pullDomainEvents());
  }
}
