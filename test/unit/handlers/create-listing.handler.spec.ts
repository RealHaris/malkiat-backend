import { Test, TestingModule } from "@nestjs/testing";
import { CreateListingHandler } from "@modules/listing-management/application/handlers/create-listing.handler";
import { CreateListingCommand } from "@modules/listing-management/application/commands/create-listing.command";
import { DI } from "@app/di.tokens";
import type { ListingRepository } from "@modules/listing-management/application/ports/listing.repository";
import type { ListingEventsPublisher } from "@modules/listing-management/application/ports/listing-events.publisher";
import {
  mockListingRepository,
  mockListingEventsPublisher,
} from "@test/mocks/providers/command-bus.mock";

describe("CreateListingHandler", () => {
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
      ],
    }).compile();

    handler = module.get<CreateListingHandler>(CreateListingHandler);
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should create a listing and publish domain events", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
        title: "Test Listing",
        description: "Test Description",
        priceAmount: "100000",
        currency: "PKR",
        propertyType: "apartment",
      };

      const command = new CreateListingCommand(payload);

      const result = await handler.execute(command);

      expect(result).toEqual({ id: "test-listing-id" });
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockPublisher.publish).toHaveBeenCalledTimes(1);

      const publishedEvents = mockPublisher.publish.mock.calls[0][0];
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]).toMatchObject({
        type: "ListingCreated",
        listingId: "test-listing-id",
        ownerId: "test-owner-id",
      });
    });

    it("should create a listing with default currency when not provided", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
        title: "Test Listing",
        priceAmount: "100000",
      };

      const command = new CreateListingCommand(payload);

      const result = await handler.execute(command);

      expect(result).toEqual({ id: "test-listing-id" });
      expect(mockRepo.create).toHaveBeenCalledTimes(1);

      const createdListing = mockRepo.create.mock.calls[0][0];
      expect(createdListing.snapshot.currency).toBe("PKR");
    });

    it("should create a listing with default status DRAFT", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
        title: "Test Listing",
        priceAmount: "100000",
      };

      const command = new CreateListingCommand(payload);

      await handler.execute(command);

      const createdListing = mockRepo.create.mock.calls[0][0];
      expect(createdListing.snapshot.status).toBe("DRAFT");
    });

    it("should handle repository errors gracefully", async () => {
      const payload = {
        id: "test-listing-id",
        ownerId: "test-owner-id",
        title: "Test Listing",
        priceAmount: "100000",
      };

      mockRepo.create.mockRejectedValueOnce(new Error("Database error"));

      const command = new CreateListingCommand(payload);

      await expect(handler.execute(command)).rejects.toThrow("Database error");
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
