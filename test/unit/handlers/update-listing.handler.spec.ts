import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Listing } from '@modules/listing-management/domain/listing.aggregate';
import { UpdateListingHandler } from '@modules/listing-management/application/handlers/update-listing.handler';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import { DI } from '@app/di.tokens';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import {
  mockListingRepository,
  mockListingEventsPublisher,
  mockDrizzleDb,
  mockAgencyRepository,
  mockAgencyFindUserById,
} from '@test/mocks/providers/command-bus.mock';
import { minimalListingProps } from '@test/fixtures/minimal-listing';

describe('UpdateListingHandler', () => {
  let handler: UpdateListingHandler;
  let mockRepo: jest.Mocked<ListingRepository>;
  let mockPublisher: jest.Mocked<ListingEventsPublisher>;

  beforeEach(async () => {
    mockRepo = mockListingRepository;
    mockPublisher = mockListingEventsPublisher;

    mockRepo.findById.mockResolvedValue(
      Listing.rehydrate(
        minimalListingProps({
          id: 'test-listing-id',
          ownerId: 'test-owner-id',
          status: 'DRAFT',
        }),
      ),
    );

    mockAgencyFindUserById.mockResolvedValue({
      id: 'test-owner-id',
      email: 'test@example.com',
      name: 'Test',
      platformRole: 'user',
      isActive: true,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateListingHandler,
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

    handler = module.get<UpdateListingHandler>(UpdateListingHandler);
    jest.clearAllMocks();

    mockRepo.findById.mockResolvedValue(
      Listing.rehydrate(
        minimalListingProps({
          id: 'test-listing-id',
          ownerId: 'test-owner-id',
          status: 'DRAFT',
        }),
      ),
    );
    mockAgencyFindUserById.mockResolvedValue({
      id: 'test-owner-id',
      email: 'test@example.com',
      name: 'Test',
      platformRole: 'user',
      isActive: true,
    });
  });

  describe('execute', () => {
    it('should update a listing and publish domain events', async () => {
      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Updated Title',
        priceAmount: 150000,
      };

      const command = new UpdateListingCommand(payload);

      await handler.execute(command);

      expect(mockRepo.update.mock.calls).toHaveLength(1);
      expect(mockPublisher.publish.mock.calls).toHaveLength(1);

      const publishedEvents = mockPublisher.publish.mock.calls[0][0];
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]).toMatchObject({
        type: 'ListingUpdated',
        listingId: 'test-listing-id',
        ownerId: 'test-owner-id',
      });
    });

    it('should update listing status when provided', async () => {
      mockAgencyFindUserById.mockResolvedValue({
        id: 'test-owner-id',
        email: 'admin@example.com',
        name: 'Admin',
        platformRole: 'admin',
        isActive: true,
      });

      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        status: 'PUBLISHED' as const,
      };

      const command = new UpdateListingCommand(payload);

      await handler.execute(command);

      expect(mockRepo.update.mock.calls).toHaveLength(1);
      const updatedListing = mockRepo.update.mock.calls[0][0];
      expect(updatedListing.snapshot.status).toBe('PUBLISHED');
    });

    it('should update all provided fields', async () => {
      mockAgencyFindUserById.mockResolvedValue({
        id: 'test-owner-id',
        email: 'admin@example.com',
        name: 'Admin',
        platformRole: 'admin',
        isActive: true,
      });

      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'New Title',
        description: 'New Description',
        priceAmount: 200000,
        currency: 'PKR' as const,
        propertyCategory: 'PLOT' as const,
        status: 'PUBLISHED' as const,
      };

      const command = new UpdateListingCommand(payload);

      await handler.execute(command);

      expect(mockRepo.update.mock.calls).toHaveLength(1);
      const updatedListing = mockRepo.update.mock.calls[0][0];
      const snapshot = updatedListing.snapshot;

      expect(snapshot.title).toBe('New Title');
      expect(snapshot.description).toBe('New Description');
      expect(snapshot.priceAmount).toBe('200000');
      expect(snapshot.currency).toBe('PKR');
      expect(snapshot.propertyCategory).toBe('PLOT');
      expect(snapshot.status).toBe('PUBLISHED');
      expect(snapshot.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle repository errors gracefully', async () => {
      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Updated Title',
      };

      mockRepo.update.mockRejectedValueOnce(new Error('Database error'));

      const command = new UpdateListingCommand(payload);

      await expect(handler.execute(command)).rejects.toThrow('Database error');
      expect(mockPublisher.publish.mock.calls).toHaveLength(0);
    });
  });
});
