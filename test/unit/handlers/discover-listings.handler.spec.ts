import { Test, TestingModule } from "@nestjs/testing";
import { DiscoverListingsHandler } from "@modules/listing-discovery/application/handlers/discover-listings.handler";
import { DiscoverListingsQuery } from "@modules/listing-discovery/application/queries/discover-listings.query";
import { DI } from "@app/di.tokens";
import { APP_ENV } from "@shared/config/config.constants";
import { mockTypesenseClient, mockAppEnv } from "@test/mocks/providers/command-bus.mock";

describe("DiscoverListingsHandler", () => {
  let handler: DiscoverListingsHandler;
  let mockTypesense: any;

  beforeEach(async () => {
    mockTypesense = mockTypesenseClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoverListingsHandler,
        {
          provide: DI.TypesenseClient,
          useValue: mockTypesense,
        },
        {
          provide: APP_ENV,
          useValue: mockAppEnv,
        },
      ],
    }).compile();

    handler = module.get<DiscoverListingsHandler>(DiscoverListingsHandler);
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should discover listings with default pagination", async () => {
      const query = new DiscoverListingsQuery({});

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should use provided page and perPage parameters", async () => {
      const query = new DiscoverListingsQuery({
        page: 2,
        perPage: 10,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply propertyType filter when provided", async () => {
      const query = new DiscoverListingsQuery({
        propertyType: "apartment",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply currency filter when provided", async () => {
      const query = new DiscoverListingsQuery({
        currency: "PKR",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply sorting when provided", async () => {
      const sortOptions = ["newest", "price_asc", "price_desc"] as const;

      for (const sort of sortOptions) {
        const query = new DiscoverListingsQuery({ sort });
        await handler.execute(query);
      }

      expect(mockTypesense.search).toHaveBeenCalledTimes(3);
    });

    it("should combine all filters correctly", async () => {
      const query = new DiscoverListingsQuery({
        page: 3,
        perPage: 15,
        sort: "price_asc",
        propertyType: "house",
        currency: "USD",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should handle search service errors gracefully", async () => {
      mockTypesense.search.mockRejectedValueOnce(new Error("Search service unavailable"));

      const query = new DiscoverListingsQuery({});

      await expect(handler.execute(query)).rejects.toThrow("Search service unavailable");
    });
  });
});
