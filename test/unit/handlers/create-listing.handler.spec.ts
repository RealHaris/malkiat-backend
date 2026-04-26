import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateListingHandler } from '@modules/listing-management/application/handlers/create-listing.handler';
import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import { DI } from '@app/di.tokens';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import {
  mockListingRepository,
  mockListingEventsPublisher,
  mockDrizzleDb,
  mockAgencyRepository,
  mockAgencyFindUserById,
  resetCreateListingDrizzleMocks,
} from '../../mocks/providers/command-bus.mock';
import { MOCK_AREA_ID, MOCK_SUBTYPE_ID } from '../../fixtures/factories';

const validCreatePayload = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-listing-id',
  ownerId: 'test-owner-id',
  title: 'Test Listing',
  description: 'Test Description',
  purpose: 'SELL' as const,
  propertyCategory: 'HOME' as const,
  propertySubtypeId: MOCK_SUBTYPE_ID,
  city: 'Karachi',
  areaId: MOCK_AREA_ID,
  locationText: 'DHA Phase 5, Karachi',
  areaValue: 5,
  areaUnit: 'MARLA' as const,
  priceAmount: 100000,
  currency: 'PKR' as const,
  ...overrides,
});

describe('CreateListingHandler', () => {
  let handler: CreateListingHandler;
  let mockRepo: jest.Mocked<ListingRepository>;
  let mockPublisher: jest.Mocked<ListingEventsPublisher>;

  beforeEach(async () => {
    mockRepo = mockListingRepository;
    mockPublisher = mockListingEventsPublisher;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateListingHandler,
        {
          provide: DI.ListingRepository,
          useValue: mockRepo,
        },
        {
          provide: DI.ListingEventsPublisher,
          useValue: mockPublisher,
        },
        {
          provide: DI.DrizzleDb,
          useValue: mockDrizzleDb,
        },
        {
          provide: DI.AgencyRepository,
          useValue: mockAgencyRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateListingHandler>(CreateListingHandler);
    jest.clearAllMocks();
    resetCreateListingDrizzleMocks();
    mockAgencyFindUserById.mockResolvedValue({
      id: 'test-owner-id',
      email: 'test@example.com',
      name: 'Test',
      platformRole: 'user',
      isActive: true,
    });
  });

  describe('execute', () => {
    it('should create a listing and publish domain events', async () => {
      const command = new CreateListingCommand(validCreatePayload());

      const result = await handler.execute(command);

      expect(result).toEqual({ id: 'test-listing-id' });
      expect(mockRepo.create.mock.calls).toHaveLength(1);
      expect(mockPublisher.publish.mock.calls).toHaveLength(1);

      const publishedEvents = mockPublisher.publish.mock.calls[0][0];
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]).toMatchObject({
        type: 'ListingCreated',
        listingId: 'test-listing-id',
        ownerId: 'test-owner-id',
      });
    });

    it('should create a listing with default currency when not provided', async () => {
      const command = new CreateListingCommand({
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Test Listing',
        purpose: 'SELL',
        propertyCategory: 'HOME',
        propertySubtypeId: MOCK_SUBTYPE_ID,
        city: 'Karachi',
        areaId: MOCK_AREA_ID,
        locationText: 'DHA Phase 5, Karachi',
        areaValue: 5,
        areaUnit: 'MARLA',
        priceAmount: 100000,
      });

      const result = await handler.execute(command);

      expect(result).toEqual({ id: 'test-listing-id' });
      expect(mockRepo.create.mock.calls).toHaveLength(1);

      const createdListing = mockRepo.create.mock.calls[0][0];
      expect(createdListing.snapshot.currency).toBe('PKR');
    });

    it('should create a listing with default status DRAFT', async () => {
      const command = new CreateListingCommand(validCreatePayload());

      await handler.execute(command);

      const createdListing = mockRepo.create.mock.calls[0][0];
      expect(createdListing.snapshot.status).toBe('DRAFT');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepo.create.mockRejectedValueOnce(new Error('Database error'));

      const command = new CreateListingCommand(validCreatePayload());

      await expect(handler.execute(command)).rejects.toThrow('Database error');
      expect(mockPublisher.publish.mock.calls).toHaveLength(0);
    });
  });
});
