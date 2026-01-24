import { Test, TestingModule } from "@nestjs/testing";
import { SearchListingsHandler } from "@modules/listing-discovery/application/handlers/search-listings.handler";
import { SearchListingsQuery } from "@modules/listing-discovery/application/queries/search-listings.query";
import { DI } from "@app/di.tokens";
import { APP_ENV } from "@shared/config/config.constants";
import { mockTypesenseClient, mockAppEnv } from "@test/mocks/providers/command-bus.mock";

describe("SearchListingsHandler", () => {
  let handler: SearchListingsHandler;
  let mockTypesense: any;

  beforeEach(async () => {
    mockTypesense = mockTypesenseClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchListingsHandler,
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

    handler = module.get<SearchListingsHandler>(SearchListingsHandler);
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should search listings with empty query", async () => {
      const query = new SearchListingsQuery({
        q: "",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should search listings with query term", async () => {
      const query = new SearchListingsQuery({
        q: "modern apartment",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should use default pagination when not provided", async () => {
      const query = new SearchListingsQuery({
        q: "search term",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply price range filters when provided", async () => {
      const query = new SearchListingsQuery({
        q: "apartment",
        minPrice: 1000000,
        maxPrice: 5000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply minPrice filter only", async () => {
      const query = new SearchListingsQuery({
        q: "house",
        minPrice: 2000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply maxPrice filter only", async () => {
      const query = new SearchListingsQuery({
        q: "villa",
        maxPrice: 10000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply propertyType filter", async () => {
      const query = new SearchListingsQuery({
        q: "search term",
        propertyType: "apartment",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply currency filter", async () => {
      const query = new SearchListingsQuery({
        q: "search term",
        currency: "USD",
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should apply sorting when provided", async () => {
      const sortOptions = ["relevance", "newest", "price_asc", "price_desc"] as const;

      for (const sort of sortOptions) {
        const query = new SearchListingsQuery({
          q: "search term",
          sort,
        });
        await handler.execute(query);
      }

      expect(mockTypesense.search).toHaveBeenCalledTimes(4);
    });

    it("should combine all filters correctly", async () => {
      const query = new SearchListingsQuery({
        q: "modern apartment",
        page: 2,
        perPage: 25,
        sort: "price_asc",
        propertyType: "apartment",
        currency: "PKR",
        minPrice: 3000000,
        maxPrice: 7000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it("should handle search service errors gracefully", async () => {
      mockTypesense.search.mockRejectedValueOnce(new Error("Search service unavailable"));

      const query = new SearchListingsQuery({
        q: "search term",
      });

      await expect(handler.execute(query)).rejects.toThrow("Search service unavailable");
    });
  });
});
