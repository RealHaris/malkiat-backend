export class SearchListingsQuery {
  constructor(
    public readonly input: {
      q?: string;
      city: string;
      areaIds?: string[];
      excludeAreaIds?: string[];
      purpose?: 'SELL' | 'RENT';
      propertyCategory?: 'HOME' | 'PLOT' | 'COMMERCIAL';
      propertySubtypeId?: string;
      minAreaSqft?: number;
      maxAreaSqft?: number;
      bedroomsCount?: number;
      page?: number;
      perPage?: number;
      sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
      minPrice?: number;
      maxPrice?: number;
    },
  ) {}
}
