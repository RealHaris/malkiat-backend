import type { ListingStatus } from '@modules/listing-management/domain/listing-status';

export class UpdateListingCommand {
  constructor(
    public readonly payload: {
      id: string;
      actorUserId?: string;
      ownerId?: string;
      title?: string;
      agencyId?: string | null;
      description?: string | null;
      purpose?: 'SELL' | 'RENT';
      propertyCategory?: 'HOME' | 'PLOT' | 'COMMERCIAL';
      propertySubtypeId?: string;
      city?: string;
      areaId?: string;
      locationText?: string;
      googleMapsUrl?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      areaValue?: number;
      areaUnit?: 'MARLA' | 'SQFT' | 'SQYD' | 'KANAL';
      areaSqft?: number;
      priceAmount?: number;
      currency?: 'PKR';
      condition?: 'BRAND_NEW' | 'EXCELLENT' | 'GOOD' | 'NEED_MINOR_WORK' | 'NEED_MAJOR_WORK' | null;
      availability?: {
        days: Array<
          'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
        >;
      } | null;
      installmentAvailable?: boolean;
      readyForPossession?: boolean;
      bedroomsCount?: number;
      bathroomsCount?: number;
      amenityIds?: string[];
      imagesJson?: string[];
      videoUrl?: string | null;
      platforms?: string[];
      status?: ListingStatus;
      publishedAt?: Date | null;
    },
  ) {}
}
