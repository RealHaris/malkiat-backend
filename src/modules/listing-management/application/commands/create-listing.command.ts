export class CreateListingCommand {
  constructor(
    public readonly payload: {
      id?: string;
      actorUserId?: string;
      ownerId: string;
      action?: 'draft' | 'submit';
      agencyId?: string;
      title: string;
      description?: string | null;
      purpose: 'SELL' | 'RENT';
      propertyCategory: 'HOME' | 'PLOT' | 'COMMERCIAL';
      propertySubtypeId: string;
      city: string;
      areaId: string;
      locationText: string;
      googleMapsUrl?: string;
      latitude?: number;
      longitude?: number;
      areaValue: number;
      areaUnit: 'MARLA' | 'SQFT' | 'SQYD' | 'KANAL';
      priceAmount: number;
      currency?: 'PKR';
      condition?: 'BRAND_NEW' | 'EXCELLENT' | 'GOOD' | 'NEED_MINOR_WORK' | 'NEED_MAJOR_WORK';
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
      amenityValues?: Record<string, string | number | boolean>;
      imagesJson?: string[];
      videoUrl?: string | null;
      platforms?: string[];
    },
  ) {}
}
