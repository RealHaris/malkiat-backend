import type { Client } from 'typesense';

export type ListingIndexDocument = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  propertyCategory?: string | null;
  propertySubtypeId?: string | null;
  city?: string | null;
  areaId?: string | null;
  locationText?: string | null;
  areaSqft?: number;
  currency: string;
  priceAmount: number;
  createdAt: number;
};

export class ListingsIndexer {
  constructor(
    private readonly client: Client,
    private readonly collection: string,
  ) {}

  async upsert(doc: ListingIndexDocument): Promise<void> {
    await this.client
      .collections(this.collection)
      .documents()
      .upsert({
        ...doc,
        description: doc.description ?? undefined,
        propertyCategory: doc.propertyCategory ?? undefined,
        propertySubtypeId: doc.propertySubtypeId ?? undefined,
        city: doc.city ?? undefined,
        areaId: doc.areaId ?? undefined,
        locationText: doc.locationText ?? undefined,
      } as any);
  }

  async deleteById(id: string): Promise<void> {
    await this.client.collections(this.collection).documents(id).delete();
  }
}
