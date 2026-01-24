import type { Client } from 'typesense';

import type { ListingCard } from '@modules/listing-discovery/application/types/listing-card';
import type { PaginatedResult } from '@modules/listing-discovery/application/types/paginated-result';

type DiscoverParams = {
  collection: string;
  page: number;
  perPage: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  propertyType?: string;
  currency?: string;
};

type SearchParams = {
  collection: string;
  q: string;
  page: number;
  perPage: number;
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  propertyType?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
};

function toListingCard(doc: any): ListingCard {
  return {
    id: String(doc.id),
    title: String(doc.title ?? ''),
    description: doc.description ?? null,
    priceAmount: Number(doc.priceAmount ?? 0),
    currency: String(doc.currency ?? 'PKR'),
    propertyType: doc.propertyType ?? null,
    status: String(doc.status ?? 'DRAFT'),
    createdAt: Number(doc.createdAt ?? 0),
  };
}

function buildFilterBy(input: {
  propertyType?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
}): string {
  const clauses: string[] = ['status:=PUBLISHED'];
  if (input.propertyType)
    clauses.push(`propertyType:=${escapeFilterValue(input.propertyType)}`);
  if (input.currency)
    clauses.push(`currency:=${escapeFilterValue(input.currency)}`);

  if (typeof input.minPrice === 'number')
    clauses.push(`priceAmount:>=${input.minPrice}`);
  if (typeof input.maxPrice === 'number')
    clauses.push(`priceAmount:<=${input.maxPrice}`);

  return clauses.join(' && ');
}

function escapeFilterValue(v: string): string {
  // Typesense filter_by uses := with unquoted strings for simple tokens.
  // For safety with spaces, wrap in backticks.
  if (/^[A-Za-z0-9_\-]+$/.test(v)) return v;
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
  if (sort === 'price_asc')
    return '_text_match:desc,priceAmount:asc,createdAt:desc';
  if (sort === 'price_desc')
    return '_text_match:desc,priceAmount:desc,createdAt:desc';
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
          propertyType: input.propertyType,
          currency: input.currency,
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
        q: input.q,
        query_by: 'title,description,embedding',
        filter_by: buildFilterBy({
          propertyType: input.propertyType,
          currency: input.currency,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
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
