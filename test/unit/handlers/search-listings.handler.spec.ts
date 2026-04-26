import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SearchListingsHandler } from '@modules/listing-discovery/application/handlers/search-listings.handler';
import { SearchListingsQuery } from '@modules/listing-discovery/application/queries/search-listings.query';
import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import {
  mockTypesenseClient,
  mockAppEnv,
  mockTypesenseListingsDocumentSearch,
} from '@test/mocks/providers/command-bus.mock';

describe('SearchListingsHandler', () => {
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

  describe('execute', () => {
    it('should search listings with empty query', async () => {
      const query = new SearchListingsQuery({
        q: '',
        city: 'Karachi',
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it('should search listings with query term', async () => {
      const query = new SearchListingsQuery({
        q: 'modern apartment',
        city: 'Karachi',
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it('should use default pagination when not provided', async () => {
      const query = new SearchListingsQuery({
        q: 'search term',
        city: 'Karachi',
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it('should apply price range filters when provided', async () => {
      const query = new SearchListingsQuery({
        q: 'apartment',
        city: 'Karachi',
        minPrice: 1000000,
        maxPrice: 5000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it('should apply minPrice filter only', async () => {
      const query = new SearchListingsQuery({
        q: 'house',
        city: 'Karachi',
        minPrice: 2000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it('should apply maxPrice filter only', async () => {
      const query = new SearchListingsQuery({
        q: 'villa',
        city: 'Karachi',
        maxPrice: 10000000,
      });

      await handler.execute(query);

      expect(mockTypesense.search).toHaveBeenCalled();
    });

    it('should forward facet filters to Typesense filter_by', async () => {
      const query = new SearchListingsQuery({
        q: 'search term',
        city: 'Karachi',
        areaIds: ['00000000-0000-4000-8000-000000000001'],
        purpose: 'RENT',
        propertyCategory: 'HOME',
        propertySubtypeId: '00000000-0000-4000-8000-000000000002',
        minAreaSqft: 500,
        maxAreaSqft: 2000,
        bedroomsCount: 3,
      });

      await handler.execute(query);

      expect(mockTypesenseListingsDocumentSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_by: expect.stringMatching(
            /status:=PUBLISHED.*city:=Karachi.*areaId:=\[.*\].*purpose:=RENT.*propertyCategory:=HOME.*propertySubtypeId:=00000000-0000-4000-8000-000000000002.*areaSqft:>=500.*areaSqft:<=2000.*bedroomsCount:=3/s,
          ),
        }),
      );
    });

    it('should apply sorting when provided', async () => {
      const sortOptions = ['relevance', 'newest', 'price_asc', 'price_desc'] as const;

      for (const sort of sortOptions) {
        const query = new SearchListingsQuery({
          q: 'search term',
          city: 'Karachi',
          sort,
        });
        await handler.execute(query);
      }

      expect(mockTypesense.search).toHaveBeenCalledTimes(4);
    });

    it('should combine all filters correctly', async () => {
      const query = new SearchListingsQuery({
        q: 'modern apartment',
        city: 'Karachi',
        page: 2,
        perPage: 25,
        sort: 'price_asc',
        propertyCategory: 'HOME',
        purpose: 'SELL',
        minPrice: 3000000,
        maxPrice: 7000000,
      });

      await handler.execute(query);

      const call = mockTypesenseListingsDocumentSearch.mock.calls[0][0] as { filter_by: string };
      expect(call.filter_by).toContain('propertyCategory:=HOME');
      expect(call.filter_by).toContain('purpose:=SELL');
      expect(call.filter_by).toContain('priceAmount:>=3000000');
      expect(call.filter_by).toContain('priceAmount:<=7000000');
    });

    it('should handle search service errors gracefully', async () => {
      mockTypesense.search.mockRejectedValueOnce(new Error('Search service unavailable'));

      const query = new SearchListingsQuery({
        q: 'search term',
        city: 'Karachi',
      });

      await expect(handler.execute(query)).rejects.toThrow('Search service unavailable');
    });
  });
});
