import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import type { TypesenseClient } from '@infra/typesense/provider';
import type { AppEnv } from '@shared/config/env';

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

export const mockTypesenseClient = {
  collections: jest.fn().mockReturnThis(),
  documents: jest.fn().mockReturnThis(),
  search: jest.fn().mockResolvedValue({
    found: 0,
    hits: [],
    page: 1,
    out_of: 0,
    request_params: {},
  }),
};

export const mockAppEnv: jest.Mocked<AppEnv> = {
  NODE_ENV: 'test',
  PORT: 3000,
  DATABASE_URL: 'postgresql://test',
  REDIS_URL: 'redis://test',
  TYPESENSE_URL: 'http://localhost:8108',
  TYPESENSE_API_KEY: 'test-key',
  TYPESENSE_COLLECTION_LISTINGS: 'listings',
  AUTH_SECRET: 'test-secret',
  AUTH_URL: 'http://localhost:3000/auth',
};

export const createMockCommandBus = (): jest.Mocked<CommandBus> =>
  ({
    execute: jest.fn().mockResolvedValue({}),
  }) as any;

export const createMockQueryBus = (): jest.Mocked<QueryBus> =>
  ({
    execute: jest.fn().mockResolvedValue({}),
  }) as any;
