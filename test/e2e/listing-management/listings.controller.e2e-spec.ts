import { Body, Controller, Delete, Patch, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { CommandBus } from '@nestjs/cqrs';
import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';

@Controller('listings')
class MockListingsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: any) {
    const result = await this.commandBus.execute(new CreateListingCommand(dto));
    return result;
  }

  @Patch()
  async update(@Body() dto: any) {
    await this.commandBus.execute(new UpdateListingCommand(dto));
    return { ok: true };
  }

  @Delete()
  async delete(@Body() dto: any) {
    await this.commandBus.execute(new DeleteListingCommand(dto));
    return { ok: true };
  }
}

describe('ListingsController (e2e)', () => {
  let app: INestApplication;
  let commandBus: CommandBus;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MockListingsController],
      providers: [
        {
          provide: CommandBus,
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

    commandBus = moduleFixture.get<CommandBus>(CommandBus);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /listings', () => {
    const validPayload = {
      id: 'test-listing-id',
      ownerId: 'test-owner-id',
      title: 'Test Listing',
      priceAmount: '100000',
    };

    it('should create a listing with valid data', async () => {
      (commandBus.execute as jest.Mock).mockResolvedValueOnce({
        id: 'test-listing-id',
      });

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(validPayload)
        .expect(201);

      expect(response.body).toEqual({ id: 'test-listing-id' });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(CreateListingCommand));
    });

    it('should create a listing with all optional fields', async () => {
      const payloadWithAllFields = {
        ...validPayload,
        description: 'Test Description',
        currency: 'USD',
        propertyType: 'apartment',
      };

      (commandBus.execute as jest.Mock).mockResolvedValueOnce({
        id: 'test-listing-id',
      });

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(payloadWithAllFields)
        .expect(201);

      expect(response.body).toEqual({ id: 'test-listing-id' });
    });

    it('should return 400 when id is missing', () => {
      const invalidPayload = {
        ownerId: 'test-owner-id',
        title: 'Test Listing',
        priceAmount: '100000',
      };

      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 when ownerId is missing', () => {
      const invalidPayload = {
        id: 'test-listing-id',
        title: 'Test Listing',
        priceAmount: '100000',
      };

      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 when title is missing', () => {
      const invalidPayload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        priceAmount: '100000',
      };

      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 when priceAmount is missing', () => {
      const invalidPayload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Test Listing',
      };

      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 for non-string id', () => {
      const invalidPayload = {
        id: 123,
        ownerId: 'test-owner-id',
        title: 'Test Listing',
        priceAmount: '100000',
      };

      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should reject extra fields with forbidNonWhitelisted', () => {
      const invalidPayload = {
        ...validPayload,
        extraField: 'should be rejected',
      };

      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should handle command bus errors', async () => {
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(validPayload)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('PATCH /listings', () => {
    const validPayload = {
      id: 'test-listing-id',
      ownerId: 'test-owner-id',
      title: 'Updated Title',
    };

    it('should update a listing with valid data', async () => {
      (commandBus.execute as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .patch('/listings')
        .send(validPayload)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UpdateListingCommand));
    });

    it('should update a listing with all optional fields', async () => {
      const payloadWithAllFields = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Updated Title',
        description: 'Updated Description',
        priceAmount: '150000',
        currency: 'USD',
        propertyType: 'villa',
        status: 'PUBLISHED',
      };

      (commandBus.execute as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .patch('/listings')
        .send(payloadWithAllFields)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });

    it('should return 400 when id is missing', () => {
      const invalidPayload = {
        ownerId: 'test-owner-id',
        title: 'Updated Title',
      };

      return request(app.getHttpServer()).patch('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 when ownerId is missing', () => {
      const invalidPayload = {
        id: 'test-listing-id',
        title: 'Updated Title',
      };

      return request(app.getHttpServer()).patch('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 for invalid status value', () => {
      const invalidPayload = {
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        status: 'INVALID_STATUS',
      };

      return request(app.getHttpServer()).patch('/listings').send(invalidPayload).expect(400);
    });

    it('should allow valid status values', async () => {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

      for (const status of validStatuses) {
        const payload = {
          id: 'test-listing-id',
          ownerId: 'test-owner-id',
          status,
        };

        (commandBus.execute as jest.Mock).mockResolvedValueOnce(undefined);

        await request(app.getHttpServer()).patch('/listings').send(payload).expect(200);
      }
    });

    it('should handle command bus errors', async () => {
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app.getHttpServer())
        .patch('/listings')
        .send(validPayload)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('DELETE /listings', () => {
    const validPayload = {
      id: 'test-listing-id',
      ownerId: 'test-owner-id',
    };

    it('should delete a listing with valid data', async () => {
      (commandBus.execute as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .delete('/listings')
        .send(validPayload)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(DeleteListingCommand));
    });

    it('should return 400 when id is missing', () => {
      const invalidPayload = {
        ownerId: 'test-owner-id',
      };

      return request(app.getHttpServer()).delete('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 when ownerId is missing', () => {
      const invalidPayload = {
        id: 'test-listing-id',
      };

      return request(app.getHttpServer()).delete('/listings').send(invalidPayload).expect(400);
    });

    it('should handle command bus errors', async () => {
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app.getHttpServer())
        .delete('/listings')
        .send(validPayload)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('Request Validation', () => {
    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/listings')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should handle empty body', () => {
      return request(app.getHttpServer()).post('/listings').send({}).expect(201);
    });
  });
});
