export class DiscoverListingsQuery {
  constructor(
    public readonly input: {
      page?: number;
      perPage?: number;
      city: string;
      sort?: 'newest' | 'price_asc' | 'price_desc';
      minPrice?: number;
      maxPrice?: number;
      areaIds?: string[];
      excludeAreaIds?: string[];
      purpose?: 'SELL' | 'RENT';
      propertyCategory?: 'HOME' | 'PLOT' | 'COMMERCIAL';
      propertySubtypeId?: string;
      minAreaSqft?: number;
      maxAreaSqft?: number;
      bedroomsCount?: number;
    },
  ) {}
}
