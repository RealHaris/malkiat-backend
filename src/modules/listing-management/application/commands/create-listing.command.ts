export class CreateListingCommand {
  constructor(
    public readonly payload: {
      id: string;
      ownerId: string;
      title: string;
      description?: string | null;
      priceAmount: number;
      currency?: string;
      propertyType?: string | null;
    },
  ) {}
}
