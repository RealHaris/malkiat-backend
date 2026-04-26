import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Listing } from '@modules/listing-management/domain/listing.aggregate';
import { DeleteListingHandler } from '@modules/listing-management/application/handlers/delete-listing.handler';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';
import { DI } from '@app/di.tokens';
import type { ListingRepository } from '@modules/listing-management/application/ports/listing.repository';
import type { ListingEventsPublisher } from '@modules/listing-management/application/ports/listing-events.publisher';
import {
  mockListingRepository,
  mockListingEventsPublisher,
  mockAgencyRepository,
  mockAgencyFindUserById,
} from '@test/mocks/providers/command-bus.mock';
import { minimalListingProps } from '@test/fixtures/minimal-listing';

describe('DeleteListingHandler', () => {
  let handler: DeleteListingHandler;
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
        DeleteListingHandler,
        {
          provide: DI.ListingRepository,
          useValue: mockRepo,
        },
        {
          provide: DI.ListingEventsPublisher,
          useValue: mockPublisher,
        },
        {
          provide: DI.AgencyRepository,
          useValue: mockAgencyRepository,
        },
      ],
    }).compile();

    handler = module.get<DeleteListingHandler>(DeleteListingHandler);
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
    it('should soft-delete a listing via update and publish domain events', async () => {
      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
      };

      const command = new DeleteListingCommand(payload);

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

      const updatedListing = mockRepo.update.mock.calls[0][0];
      expect(updatedListing.snapshot.status).toBe('DELETED');
    });

    it('should handle repository errors gracefully', async () => {
      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
      };

      mockRepo.update.mockRejectedValueOnce(new Error('Database error'));

      const command = new DeleteListingCommand(payload);

      await expect(handler.execute(command)).rejects.toThrow('Database error');
      expect(mockPublisher.publish.mock.calls).toHaveLength(0);
    });

    it('should not publish events if repository update fails', async () => {
      const payload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
      };

      mockRepo.update.mockRejectedValueOnce(new Error('Connection failed'));

      const command = new DeleteListingCommand(payload);

      await expect(handler.execute(command)).rejects.toThrow('Connection failed');
      expect(mockPublisher.publish.mock.calls).toHaveLength(0);
    });
  });
});
