import type { Client } from 'typesense';

export type ListingIndexDocument = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  propertyType?: string | null;
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
        propertyType: doc.propertyType ?? undefined,
      } as any);
  }

  async deleteById(id: string): Promise<void> {
    await this.client.collections(this.collection).documents(id).delete();
  }
}
