import { Test, TestingModule } from '@nestjs/testing';
import { DiscoverListingsHandler } from '@modules/listing-discovery/application/handlers/discover-listings.handler';
import { DiscoverListingsQuery } from '@modules/listing-discovery/application/queries/discover-listings.query';
import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import {
  mockTypesenseClient,
  mockAppEnv,
  mockTypesenseListingsDocumentSearch,
} from '@test/mocks/providers/command-bus.mock';

describe('DiscoverListingsHandler', () => {
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

  describe('execute', () => {
    it('should discover listings with default pagination', async () => {
      const query = new DiscoverListingsQuery({ city: 'Karachi' });

      await handler.execute(query);

      expect(mockTypesenseListingsDocumentSearch).toHaveBeenCalled();
    });

    it('should use provided page and perPage parameters', async () => {
      const query = new DiscoverListingsQuery({
        city: 'Karachi',
        page: 2,
        perPage: 10,
      });

      await handler.execute(query);

      expect(mockTypesenseListingsDocumentSearch).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, per_page: 10 }),
      );
    });

    it('should forward minPrice and maxPrice to Typesense filter_by', async () => {
      const query = new DiscoverListingsQuery({
        city: 'Karachi',
        minPrice: 1_000_000,
        maxPrice: 100_000_000,
      });

      await handler.execute(query);

      expect(mockTypesenseListingsDocumentSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_by: expect.stringContaining('priceAmount:>=1000000'),
        }),
      );
      const call = mockTypesenseListingsDocumentSearch.mock.calls[0][0] as { filter_by: string };
      expect(call.filter_by).toContain('priceAmount:<=100000000');
    });

    it('should apply sorting when provided', async () => {
      const sortOptions = ['newest', 'price_asc', 'price_desc'] as const;

      for (const sort of sortOptions) {
        const query = new DiscoverListingsQuery({ city: 'Karachi', sort });
        await handler.execute(query);
      }

      expect(mockTypesenseListingsDocumentSearch).toHaveBeenCalledTimes(3);
    });

    it('should combine pagination, sort, and price filters', async () => {
      const query = new DiscoverListingsQuery({
        city: 'Karachi',
        page: 3,
        perPage: 15,
        sort: 'price_asc',
        minPrice: 5_000_000,
        maxPrice: 50_000_000,
      });

      await handler.execute(query);

      const call = mockTypesenseListingsDocumentSearch.mock.calls[0][0] as { filter_by: string };
      expect(call.filter_by).toContain('priceAmount:>=5000000');
      expect(call.filter_by).toContain('priceAmount:<=50000000');
    });

    it('should handle search service errors gracefully', async () => {
      mockTypesense.search.mockRejectedValueOnce(new Error('Search service unavailable'));

      const query = new DiscoverListingsQuery({ city: 'Karachi' });

      await expect(handler.execute(query)).rejects.toThrow('Search service unavailable');
    });
  });
});
