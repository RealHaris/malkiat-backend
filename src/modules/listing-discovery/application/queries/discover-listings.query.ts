export class DiscoverListingsQuery {
  constructor(
    public readonly input: {
      page?: number;
      perPage?: number;
      sort?: "newest" | "price_asc" | "price_desc";
      propertyType?: string;
      currency?: string;
    },
  ) {}
}
