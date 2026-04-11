export class SearchListingsQuery {
  constructor(
    public readonly input: {
      q: string;
      city: string;
      areaId?: string;
      page?: number;
      perPage?: number;
      sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
      minPrice?: number;
      maxPrice?: number;
    },
  ) {}
}
