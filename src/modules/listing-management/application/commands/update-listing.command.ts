export class UpdateListingCommand {
  constructor(
    public readonly payload: {
      id: string;
      ownerId: string;
      title?: string;
      description?: string | null;
      priceAmount?: string;
      currency?: string;
      propertyType?: string | null;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    },
  ) {}
}
