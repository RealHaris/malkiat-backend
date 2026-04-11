export class DiscoverListingsQuery {
  constructor(
    public readonly input: {
      page?: number;
      perPage?: number;
      city: string;
      sort?: 'newest' | 'price_asc' | 'price_desc';
    },
  ) {}
}
