import type { Client } from 'typesense';

import type { ListingCard } from '@modules/listing-discovery/application/types/listing-card';
import type { PaginatedResult } from '@modules/listing-discovery/application/types/paginated-result';

type DiscoverParams = {
  collection: string;
  page: number;
  perPage: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  city: string;
};

type SearchParams = {
  collection: string;
  q?: string;
  page: number;
  perPage: number;
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  city: string;
  areaIds?: string[];
  purpose?: string;
  propertyCategory?: string;
  propertySubtypeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  bedroomsCount?: number;
};

function toListingCard(doc: any): ListingCard {
  return {
    id: String(doc.id),
    ownerId: String(doc.ownerId ?? ''),
    title: String(doc.title ?? ''),
    description: doc.description ?? null,
    purpose: String(doc.purpose ?? 'SELL') as any,
    propertyCategory: String(doc.propertyCategory ?? 'HOME') as any,
    propertySubtypeId: String(doc.propertySubtypeId ?? ''),
    city: String(doc.city ?? 'Karachi'),
    areaId: String(doc.areaId ?? ''),
    locationText: String(doc.locationText ?? ''),
    areaValue: Number(doc.areaValue ?? 0),
    areaUnit: String(doc.areaUnit ?? 'MARLA') as any,
    areaSqft: Number(doc.areaSqft ?? 0),
    priceAmount: Number(doc.priceAmount ?? 0),
    currency: String(doc.currency ?? 'PKR') as any,
    condition: (doc.condition ?? null) as any,
    availability: Array.isArray(doc.availabilityDays)
      ? ({ days: doc.availabilityDays.map((d: any) => String(d)) } as any)
      : null,
    installmentAvailable: Boolean(doc.installmentAvailable ?? false),
    readyForPossession: Boolean(doc.readyForPossession ?? false),
    bedroomsCount: doc.bedroomsCount ?? null,
    bathroomsCount: doc.bathroomsCount ?? null,
    imagesJson: (doc.imagesJson as string[] | undefined) ?? [],
    videoUrl: doc.videoUrl ?? null,
    platforms: (doc.platforms as string[] | undefined) ?? ['ZAMEEN'],
    status: String(doc.status ?? 'DRAFT'),
    publishedAt: doc.publishedAt ? Number(doc.publishedAt) : null,
    createdAt: Number(doc.createdAt ?? 0),
  };
}

function buildFilterBy(input: {
  city: string;
  areaIds?: string[];
  purpose?: string;
  propertyCategory?: string;
  propertySubtypeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  bedroomsCount?: number;
}): string {
  const clauses: string[] = ['status:=PUBLISHED', `city:=${escapeFilterValue(input.city)}`];

  if (input.areaIds && input.areaIds.length > 0) {
    const escapedAreaIds = input.areaIds.map(escapeFilterValue);
    clauses.push(`areaId:=[${escapedAreaIds.join(',')}]`);
  }

  if (input.purpose) clauses.push(`purpose:=${escapeFilterValue(input.purpose)}`);
  if (input.propertyCategory)
    clauses.push(`propertyCategory:=${escapeFilterValue(input.propertyCategory)}`);
  if (input.propertySubtypeId)
    clauses.push(`propertySubtypeId:=${escapeFilterValue(input.propertySubtypeId)}`);

  if (typeof input.minPrice === 'number') clauses.push(`priceAmount:>=${input.minPrice}`);
  if (typeof input.maxPrice === 'number') clauses.push(`priceAmount:<=${input.maxPrice}`);

  if (typeof input.minAreaSqft === 'number') clauses.push(`areaSqft:>=${input.minAreaSqft}`);
  if (typeof input.maxAreaSqft === 'number') clauses.push(`areaSqft:<=${input.maxAreaSqft}`);

  if (typeof input.bedroomsCount === 'number')
    clauses.push(`bedroomsCount:=${input.bedroomsCount}`);

  return clauses.join(' && ');
}

function escapeFilterValue(v: string): string {
  // Typesense filter_by uses := with unquoted strings for simple tokens.
  // For safety with spaces, wrap in backticks.
  if (/^[A-Za-z0-9_-]+$/.test(v)) return v;
  return '`' + v.replace(/`/g, '\\`') + '`';
}

function sortByForDiscover(sort?: DiscoverParams['sort']): string {
  if (sort === 'price_asc') return 'priceAmount:asc,createdAt:desc';
  if (sort === 'price_desc') return 'priceAmount:desc,createdAt:desc';
  return 'createdAt:desc';
}

function sortByForSearch(sort?: SearchParams['sort']): string | undefined {
  if (!sort || sort === 'relevance') return undefined;
  if (sort === 'newest') return '_text_match:desc,createdAt:desc';
  if (sort === 'price_asc') return '_text_match:desc,priceAmount:asc,createdAt:desc';
  if (sort === 'price_desc') return '_text_match:desc,priceAmount:desc,createdAt:desc';
  return undefined;
}

export class TypesenseListingsSearch {
  constructor(private readonly client: Client) {}

  async discover(input: DiscoverParams): Promise<PaginatedResult<ListingCard>> {
    const res = await this.client
      .collections(input.collection)
      .documents()
      .search({
        q: '*',
        query_by: 'title',
        filter_by: buildFilterBy({
          city: input.city,
        }),
        sort_by: sortByForDiscover(input.sort),
        page: input.page,
        per_page: input.perPage,
        exclude_fields: 'embedding',
      } as any);

    return {
      items: (res.hits ?? []).map((h: any) => toListingCard(h.document)),
      page: input.page,
      perPage: input.perPage,
      found: (res as any).found,
    };
  }

  async search(input: SearchParams): Promise<PaginatedResult<ListingCard>> {
    const res = await this.client
      .collections(input.collection)
      .documents()
      .search({
        q: input.q || '*',
        query_by: 'title,description,embedding',
        filter_by: buildFilterBy({
          city: input.city,
          areaIds: input.areaIds,
          purpose: input.purpose,
          propertyCategory: input.propertyCategory,
          propertySubtypeId: input.propertySubtypeId,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          minAreaSqft: input.minAreaSqft,
          maxAreaSqft: input.maxAreaSqft,
          bedroomsCount: input.bedroomsCount,
        }),
        // Hybrid: Typesense generates query embeddings because the collection schema has `embed` config.
        vector_query: 'embedding:([], k:200)',
        sort_by: sortByForSearch(input.sort),
        page: input.page,
        per_page: input.perPage,
        exclude_fields: 'embedding',
      } as any);

    return {
      items: (res.hits ?? []).map((h: any) => toListingCard(h.document)),
      page: input.page,
      perPage: input.perPage,
      found: (res as any).found,
    };
  }
}
