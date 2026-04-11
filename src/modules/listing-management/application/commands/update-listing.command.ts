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
      latitude?: number | null;
      longitude?: number | null;
      areaValue?: number;
      areaUnit?: 'MARLA' | 'SQFT' | 'SQYD' | 'KANAL';
      areaSqft?: number;
      priceAmount?: number;
      currency?: 'PKR';
      installmentAvailable?: boolean;
      readyForPossession?: boolean;
      bedroomsCount?: number;
      bathroomsCount?: number;
      amenityIds?: string[];
      imagesJson?: string[];
      videoUrl?: string | null;
      platforms?: string[];
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      publishedAt?: Date | null;
    },
  ) {}
}
