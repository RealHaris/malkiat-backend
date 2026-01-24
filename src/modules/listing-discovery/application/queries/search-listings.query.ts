export class SearchListingsQuery {
  constructor(
    public readonly input: {
      q: string;
      page?: number;
      perPage?: number;
      sort?: "relevance" | "newest" | "price_asc" | "price_desc";
      propertyType?: string;
      currency?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ) {}
}
