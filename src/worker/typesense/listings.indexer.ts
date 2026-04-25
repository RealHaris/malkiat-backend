import type { Client } from 'typesense';

export type ListingIndexDocument = {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  purpose: string;
  status: string;
  condition?: string | null;
  bedroomsCount?: number | null;
  bathroomsCount?: number | null;
  availabilityDays?: string[];
  propertyCategory?: string | null;
  propertySubtypeId?: string | null;
  city?: string | null;
  areaId?: string | null;
  locationText?: string | null;
  googleMapsUrl?: string | null;
  areaValue: number;
  areaUnit: string;
  areaSqft?: number;
  priceAmount: number;
  currency: string;
  installmentAvailable: boolean;
  readyForPossession: boolean;
  imagesJson: string[];
  videoUrl?: string | null;
  platforms: string[];
  publishedAt?: number | null;
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
        purpose: doc.purpose,
        condition: doc.condition ?? undefined,
        bedroomsCount: doc.bedroomsCount ?? undefined,
        availabilityDays: doc.availabilityDays?.length ? doc.availabilityDays : undefined,
        propertyCategory: doc.propertyCategory ?? undefined,
        propertySubtypeId: doc.propertySubtypeId ?? undefined,
        city: doc.city ?? undefined,
        areaId: doc.areaId ?? undefined,
        locationText: doc.locationText ?? undefined,
        googleMapsUrl: doc.googleMapsUrl ?? undefined,
      } as any);
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.client.collections(this.collection).documents(id).delete();
    } catch (error: any) {
      if (error?.httpStatus === 404) {
        return;
      }
      throw error;
    }
  }
}
