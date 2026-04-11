export class CreateListingCommand {
  constructor(
    public readonly payload: {
      id?: string;
      actorUserId?: string;
      ownerId: string;
      agencyId?: string;
      title: string;
      description?: string | null;
      purpose: 'SELL' | 'RENT';
      propertyCategory: 'HOME' | 'PLOT' | 'COMMERCIAL';
      propertySubtypeId: string;
      city: string;
      areaId: string;
      locationText: string;
      latitude?: number;
      longitude?: number;
      areaValue: number;
      areaUnit: 'MARLA' | 'SQFT' | 'SQYD' | 'KANAL';
      priceAmount: number;
      currency?: 'PKR';
      installmentAvailable?: boolean;
      readyForPossession?: boolean;
      bedroomsCount?: number;
      bathroomsCount?: number;
      amenityIds?: string[];
      imagesJson?: string[];
      videoUrl?: string | null;
      platforms?: string[];
    },
  ) {}
}
