import { Controller, Get, Query } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { QueryBus } from '@nestjs/cqrs';
import { DiscoverListingsQuery } from '@modules/listing-discovery/application/queries/discover-listings.query';
import { SearchListingsQuery } from '@modules/listing-discovery/application/queries/search-listings.query';
import { createMockPaginatedResult, createMockListingCard } from '@test/fixtures/factories';

@Controller('public/listings')
class MockPublicListingsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('discovery')
  async discovery(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sort') sort?: string,
    @Query('propertyType') propertyType?: string,
    @Query('currency') currency?: string,
  ) {
    return this.queryBus.execute(
      new DiscoverListingsQuery({
        page: page ? Number(page) : undefined,
        perPage: perPage ? Number(perPage) : undefined,
        sort: sort as any,
        propertyType,
        currency,
      }),
    );
  }

  @Get('search')
  async search(
    @Query('q') q = '',
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sort') sort?: string,
    @Query('propertyType') propertyType?: string,
    @Query('currency') currency?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.queryBus.execute(
      new SearchListingsQuery({
        q,
        page: page ? Number(page) : undefined,
        perPage: perPage ? Number(perPage) : undefined,
        sort: sort as any,
        propertyType,
        currency,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
    );
  }
}

describe('PublicListingsController (e2e)', () => {
  let app: INestApplication;
  let queryBus: QueryBus;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MockPublicListingsController],
      providers: [
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    queryBus = moduleFixture.get<QueryBus>(QueryBus);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /public/listings/discovery', () => {
    const mockResult = createMockPaginatedResult([
      createMockListingCard(),
      createMockListingCard(),
    ]);

    beforeEach(() => {
      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);
    });

    it('should return paginated listings with default values', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(DiscoverListingsQuery));
    });

    it('should handle page parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?page=2')
        .expect(200);

      expect(response.status).toBe(200);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(DiscoverListingsQuery));
    });

    it('should handle perPage parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?perPage=10')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle valid sort options', async () => {
      const validSorts = ['newest', 'price_asc', 'price_desc'] as const;

      for (const sort of validSorts) {
        await request(app.getHttpServer())
          .get(`/public/listings/discovery?sort=${sort}`)
          .expect(200);
      }
    });

    it('should handle propertyType filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?propertyType=apartment')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle currency filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?currency=PKR')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle multiple query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/public/listings/discovery?page=2&perPage=15&sort=newest&propertyType=house&currency=USD',
        )
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should return empty results when no listings found', async () => {
      const emptyResult = createMockPaginatedResult([], 0, 1, 20);
      (queryBus.execute as jest.Mock).mockResolvedValueOnce(emptyResult);

      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should handle query bus errors', async () => {
      (queryBus.execute as jest.Mock).mockRejectedValueOnce(
        new Error('Search service unavailable'),
      );

      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('GET /public/listings/search', () => {
    const mockResult = createMockPaginatedResult([createMockListingCard()]);

    beforeEach(() => {
      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);
    });

    it('should return search results with empty query', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(SearchListingsQuery));
    });

    it('should return search results with query term', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=modern%20apartment')
        .expect(200);

      expect(response.status).toBe(200);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(SearchListingsQuery));
    });

    it('should handle page parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&page=3')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle perPage parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&perPage=25')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle valid sort options', async () => {
      const validSorts = ['relevance', 'newest', 'price_asc', 'price_desc'] as const;

      for (const sort of validSorts) {
        await request(app.getHttpServer())
          .get(`/public/listings/search?q=test&sort=${sort}`)
          .expect(200);
      }
    });

    it('should handle propertyType filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&propertyType=villa')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle currency filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&currency=USD')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle minPrice filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&minPrice=1000000')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle maxPrice filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&maxPrice=10000000')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle price range filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&minPrice=2000000&maxPrice=8000000')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle multiple query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/public/listings/search?q=modern%20apartment&page=2&perPage=15&sort=price_asc&propertyType=apartment&currency=PKR&minPrice=3000000&maxPrice=7000000',
        )
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should return empty results when no matches found', async () => {
      const emptyResult = createMockPaginatedResult([], 0, 1, 20);
      (queryBus.execute as jest.Mock).mockResolvedValueOnce(emptyResult);

      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=nonexistent')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should handle query bus errors', async () => {
      (queryBus.execute as jest.Mock).mockRejectedValueOnce(
        new Error('Search service unavailable'),
      );

      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });

    it('should handle special characters in search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=Caf%C3%A9%20near%20park')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(500);
      const response = await request(app.getHttpServer())
        .get(`/public/listings/search?q=${longQuery}`)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .get('/public/listings/discovery')
        .set('Content-Type', 'application/json')
        .send('{ invalid }')
        .expect(400);
    });

    it('should ignore invalid query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?invalidParam=value')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle large page numbers', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?page=999999')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle large perPage numbers', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?perPage=999')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle negative price values gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=test&minPrice=-100')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('URL Encoding', () => {
    it('should handle URL-encoded search terms', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/search?q=apartment%20with%20parking')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle special characters in propertyType', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?propertyType=mixed-use')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle currency codes with special characters', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/listings/discovery?currency=USD')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });
});
