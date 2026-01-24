import { Test, TestingModule } from "@nestjs/testing";
import { DeleteListingHandler } from "@modules/listing-management/application/handlers/delete-listing.handler";
import { DeleteListingCommand } from "@modules/listing-management/application/commands/delete-listing.command";
import { DI } from "@app/di.tokens";
import type { ListingRepository } from "@modules/listing-management/application/ports/listing.repository";
import type { ListingEventsPublisher } from "@modules/listing-management/application/ports/listing-events.publisher";
import {
  mockListingRepository,
  mockListingEventsPublisher,
} from "@test/mocks/providers/command-bus.mock";

describe("DeleteListingHandler", () => {
  let handler: DeleteListingHandler;
  let mockRepo: jest.Mocked<ListingRepository>;
  let mockPublisher: jest.Mocked<ListingEventsPublisher>;

  beforeEach(async () => {
    mockRepo = mockListingRepository;
    mockPublisher = mockListingEventsPublisher;

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
      ],
    }).compile();

    handler = module.get<DeleteListingHandler>(DeleteListingHandler);
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should delete a listing and publish domain events", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
      };

      const command = new DeleteListingCommand(payload);

      await handler.execute(command);

      expect(mockRepo.deleteById).toHaveBeenCalledTimes(1);
      expect(mockRepo.deleteById).toHaveBeenCalledWith("test-listing-id");
      expect(mockPublisher.publish).toHaveBeenCalledTimes(1);

      const publishedEvents = mockPublisher.publish.mock.calls[0][0];
      expect(publishedEvents).toHaveLength(2);
      expect(publishedEvents[1]).toMatchObject({
        type: "ListingDeleted",
        listingId: "test-listing-id",
        ownerId: "test-owner-id",
      });
    });

    it("should handle repository errors gracefully", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
      };

      mockRepo.deleteById.mockRejectedValueOnce(new Error("Database error"));

      const command = new DeleteListingCommand(payload);

      await expect(handler.execute(command)).rejects.toThrow("Database error");
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should not publish events if repository delete fails", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
      };

      mockRepo.deleteById.mockRejectedValueOnce(new Error("Connection failed"));

      const command = new DeleteListingCommand(payload);

      await expect(handler.execute(command)).rejects.toThrow("Connection failed");
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
