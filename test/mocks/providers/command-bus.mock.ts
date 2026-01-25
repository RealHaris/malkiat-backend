import type { CommandBus, QueryBus } from "@nestjs/cqrs";
import type { ListingRepository } from "@modules/listing-management/application/ports/listing.repository";
import type { ListingEventsPublisher } from "@modules/listing-management/application/ports/listing-events.publisher";
import type { AppEnv } from "@shared/config/env";

export const mockCommandBus = {
  execute: jest.fn().mockResolvedValue({}),
};

export const mockQueryBus = {
  execute: jest.fn().mockResolvedValue({}),
};

export const mockListingRepository: jest.Mocked<ListingRepository> = {
  create: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  deleteById: jest.fn().mockResolvedValue(undefined),
};

export const mockListingEventsPublisher: jest.Mocked<ListingEventsPublisher> = {
  publish: jest.fn().mockResolvedValue(undefined),
};

const mockSearchFn = jest.fn().mockResolvedValue({
  found: 0,
  hits: [],
  page: 1,
  out_of: 0,
  request_params: {},
});

export const mockTypesenseClient = {
  collections: jest.fn().mockReturnValue({
    documents: jest.fn().mockReturnValue({
      search: mockSearchFn,
    }),
  }),
  search: mockSearchFn,
} as any;

export const mockAppEnv: jest.Mocked<AppEnv> = {
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "error",
  LOG_DIR: "logs",
  LOG_MAX_FILES: "3d",
  LOG_MAX_SIZE: "20m",
  DATABASE_URL: "postgresql://test",
  REDIS_URL: "redis://test",
  TYPESENSE_HOST: "localhost",
  TYPESENSE_PORT: 8108,
  TYPESENSE_PROTOCOL: "http",
  TYPESENSE_ADMIN_API_KEY: "test-key",
  TYPESENSE_COLLECTION_LISTINGS: "listings",
  LISTING_EVENTS_QUEUE_NAME: "listing-events",
  BETTER_AUTH_SECRET: "test-secret",
  BETTER_AUTH_BASE_URL: "http://localhost:3002/auth",
  RESEND_FROM_EMAIL: "hello@example.com",
};

export const createMockCommandBus = (): jest.Mocked<CommandBus> =>
  ({
    execute: jest.fn().mockResolvedValue({}),
  }) as any;

export const createMockQueryBus = (): jest.Mocked<QueryBus> =>
  ({
    execute: jest.fn().mockResolvedValue({}),
  }) as any;
