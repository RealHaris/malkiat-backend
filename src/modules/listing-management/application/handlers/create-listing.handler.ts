import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import { DI } from '@app/di.tokens';
import { Listing } from '@modules/listing-management/domain/listing.aggregate';
import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import { areas, propertySubtypes, toSqft } from '@infra/db/drizzle/schema';
import { DrizzleAgencyRepository } from '@modules/identity-access/agencies/infrastructure/drizzle-agency.repository';
import { canPostForAgency } from '@modules/identity-access/agencies/presentation/agency-authz';

@CommandHandler(CreateListingCommand)
export class CreateListingHandler implements ICommandHandler<CreateListingCommand> {
  constructor(
    @Inject(DI.ListingRepository) private readonly repo: ListingRepository,
    @Inject(DI.ListingEventsPublisher)
    private readonly publisher: ListingEventsPublisher,
    @Inject(DI.DrizzleDb) private readonly db: PostgresJsDatabase<any>,
    @Inject(DI.AgencyRepository)
    private readonly agencyRepo: DrizzleAgencyRepository,
  ) {}

  async execute(command: CreateListingCommand): Promise<{ id: string }> {
    const actorUserId = command.payload.actorUserId ?? command.payload.ownerId;
    if (!actorUserId) throw new BadRequestException('Actor user is required');

    if (command.payload.city !== 'Karachi') {
      throw new BadRequestException('City must be Karachi');
    }

    let ownerId = command.payload.ownerId;
    if (command.payload.agencyId) {
      const agency = await this.agencyRepo.getAgencyById(command.payload.agencyId);
      if (!agency) {
        throw new BadRequestException('Agency not found');
      }
      const actor = await this.agencyRepo.findUserById(actorUserId);
      const membership = await this.agencyRepo.getMembership(command.payload.agencyId, actorUserId);
      if (!actor || !canPostForAgency({ id: actor.id, platformRole: actor.platformRole }, membership ?? undefined)) {
        throw new BadRequestException('You cannot create listings for this agency');
      }
      if (agency.status !== 'active') {
        throw new BadRequestException('Cannot create listing for archived agency');
      }
      ownerId = agency.ownerUserId;
    }

    const [subtype] = await this.db
      .select({ id: propertySubtypes.id, category: propertySubtypes.category })
      .from(propertySubtypes)
      .where(eq(propertySubtypes.id, command.payload.propertySubtypeId))
      .limit(1);

    if (!subtype) {
      throw new BadRequestException('Invalid property subtype ID');
    }
    if (subtype.category !== command.payload.propertyCategory) {
      throw new BadRequestException('Property subtype does not belong to selected category');
    }

    const [area] = await this.db
      .select({ id: areas.id, city: areas.city, isActive: areas.isActive })
      .from(areas)
      .where(eq(areas.id, command.payload.areaId))
      .limit(1);

    if (!area || !area.isActive || area.city !== 'Karachi') {
      throw new BadRequestException('Invalid area ID for Karachi');
    }

    const listingId = command.payload.id ?? randomUUID();
    const status = command.payload.action === 'submit' ? 'UNDER_REVIEW' : 'DRAFT';
    const listing = Listing.create({
      id: listingId,
      createdByUserId: actorUserId,
      ownerId,
      agencyId: command.payload.agencyId ?? null,
      title: command.payload.title,
      description: command.payload.description,
      purpose: command.payload.purpose,
      propertyCategory: command.payload.propertyCategory,
      propertySubtypeId: command.payload.propertySubtypeId,
      city: command.payload.city,
      areaId: command.payload.areaId,
      locationText: command.payload.locationText,
      latitude: command.payload.latitude?.toString() ?? null,
      longitude: command.payload.longitude?.toString() ?? null,
      areaValue: command.payload.areaValue.toString(),
      areaUnit: command.payload.areaUnit,
      areaSqft: toSqft(command.payload.areaValue, command.payload.areaUnit).toString(),
      priceAmount: command.payload.priceAmount.toString(),
      currency: command.payload.currency ?? 'PKR',
      installmentAvailable: command.payload.installmentAvailable ?? false,
      readyForPossession: command.payload.readyForPossession ?? false,
      bedroomsCount: command.payload.bedroomsCount ?? null,
      bathroomsCount: command.payload.bathroomsCount ?? null,
      imagesJson: command.payload.imagesJson ?? [],
      videoUrl: command.payload.videoUrl ?? null,
      platforms: command.payload.platforms ?? ['ZAMEEN'],
      amenityIds: command.payload.amenityIds ?? [],
      amenityValues: command.payload.amenityValues ?? {},
      status,
    });

    await this.repo.create(listing);
    await this.publisher.publish(listing.pullDomainEvents());

    return { id: listing.snapshot.id };
  }
}
