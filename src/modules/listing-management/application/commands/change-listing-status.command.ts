import type { ListingStatus } from '@modules/listing-management/domain/listing-status';

export class ChangeListingStatusCommand {
  constructor(
    public readonly payload: {
      id: string;
      actorUserId: string;
      status: ListingStatus;
    },
  ) {}
}
