export type ListingCard = {
  id: string;
  title: string;
  description?: string | null;
  priceAmount: number;
  currency: string;
  propertyType?: string | null;
  status: string;
  createdAt: number;
};
