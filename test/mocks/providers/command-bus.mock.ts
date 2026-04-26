import { jest } from '@jest/globals';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Listing, ListingDomainEvent } from '@modules/listing-management/domain/listing.aggregate';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import type { AppEnv } from '@shared/config/env';
import type { DrizzleAgencyRepository } from '@modules/identity-access/agencies/infrastructure/drizzle-agency.repository';

import { MOCK_AREA_ID, MOCK_SUBTYPE_ID } from '@test/fixtures/factories';

export const mockCommandBus = {
  execute: jest.fn(async (_command: unknown) => ({})),
};

export const mockQueryBus = {
  execute: jest.fn(async (_query: unknown) => ({})),
};

export const mockListingRepository: jest.Mocked<ListingRepository> = {
  create: jest.fn(async (_listing: Listing) => undefined),
  update: jest.fn(async (_listing: Listing) => undefined),
  findById: jest.fn(async (_listingId: string) => null),
  listByOwner: jest.fn(async (_input: Parameters<ListingRepository['listByOwner']>[0]) => ({
    items: [],
    total: 0,
  })),
  listByAgency: jest.fn(async (_input: Parameters<ListingRepository['listByAgency']>[0]) => ({
    items: [],
    total: 0,
  })),
  listAll: jest.fn(async (_input: Parameters<ListingRepository['listAll']>[0]) => ({
    items: [],
    total: 0,
  })),
  listPublic: jest.fn(async (_input: Parameters<ListingRepository['listPublic']>[0]) => ({
    items: [],
    total: 0,
  })),
  searchPublic: jest.fn(async (_input: Parameters<ListingRepository['searchPublic']>[0]) => ({
    items: [],
    total: 0,
  })),
  deleteById: jest.fn(async (_listingId: string) => undefined),
};

export const mockListingEventsPublisher: jest.Mocked<ListingEventsPublisher> = {
  publish: jest.fn(async (_events: ListingDomainEvent[]) => undefined),
};

/** Same fn used for `collections().documents().search` — assert calls on this in tests. */
export const mockTypesenseListingsDocumentSearch = jest.fn(
  async (..._args: unknown[]) => ({
    found: 0,
    hits: [] as unknown[],
    page: 1,
    out_of: 0,
    request_params: {} as Record<string, unknown>,
  }),
);

export const mockTypesenseClient = {
  collections: jest.fn().mockReturnValue({
    documents: jest.fn().mockReturnValue({
      search: mockTypesenseListingsDocumentSearch,
    }),
  }),
  search: mockTypesenseListingsDocumentSearch,
} as any;

export const mockAppEnv: jest.Mocked<AppEnv> = {
  NODE_ENV: 'test',
  PORT: 3000,
  LOG_LEVEL: 'error',
  LOG_DIR: 'logs',
  LOG_MAX_FILES: '3d',
  LOG_MAX_SIZE: '20m',
  DATABASE_URL: 'postgresql://test',
  REDIS_URL: 'redis://test',
  TYPESENSE_HOST: 'localhost',
  TYPESENSE_PORT: 8108,
  TYPESENSE_PROTOCOL: 'http',
  TYPESENSE_ADMIN_API_KEY: 'test-key',
  TYPESENSE_COLLECTION_LISTINGS: 'listings',
  LISTING_EVENTS_QUEUE_NAME: 'listing-events',
  BETTER_AUTH_SECRET: 'test-secret',
  BETTER_AUTH_BASE_URL: 'http://localhost:3002/auth',
  APP_PUBLIC_URL: 'http://localhost:3001',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3001,https://www.malkiat.site,https://malkiat.site',
  RESEND_FROM_EMAIL: 'hello@example.com',
  BULLMQ_DASHBOARD_USER: 'admin',
  BULLMQ_DASHBOARD_PASSWORD: 'admin',
};

export const createMockCommandBus = (): jest.Mocked<CommandBus> =>
  ({
    execute: jest.fn(async (_command: unknown) => ({})),
  }) as any;

export const createMockQueryBus = (): jest.Mocked<QueryBus> =>
  ({
    execute: jest.fn(async (_query: unknown) => ({})),
  }) as any;

/** `limit(1)` chain for `create` / `update` handler Drizzle lookups (subtype, then area). */
export const mockDrizzleLimit = jest.fn<(n?: number) => Promise<unknown[]>>();

export const mockDrizzleDb = {
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: mockDrizzleLimit,
      })),
    })),
  })),
};

export const resetCreateListingDrizzleMocks = (): void => {
  mockDrizzleLimit.mockReset();
  mockDrizzleLimit
    .mockResolvedValueOnce([{ id: MOCK_SUBTYPE_ID, category: 'HOME' }])
    .mockResolvedValueOnce([{ id: MOCK_AREA_ID, city: 'Karachi', isActive: true }]);
};

export const mockAgencyFindUserById = jest.fn<DrizzleAgencyRepository['findUserById']>().mockResolvedValue({
  id: 'test-owner-id',
  email: 'test@example.com',
  name: 'Test',
  platformRole: 'user',
  isActive: true,
});

export const mockAgencyGetAgencyById = jest.fn().mockImplementation(async () => null);

export const mockAgencyGetMembership = jest.fn().mockImplementation(async () => null);

export const mockAgencyRepository = {
  findUserById: mockAgencyFindUserById,
  getAgencyById: mockAgencyGetAgencyById,
  getMembership: mockAgencyGetMembership,
} as unknown as DrizzleAgencyRepository;
