import { jest } from '@jest/globals';
import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { CommandBus } from '@nestjs/cqrs';
import { CreateListingCommand } from '@modules/listing-management/application/commands/create-listing.command';
import { UpdateListingCommand } from '@modules/listing-management/application/commands/update-listing.command';
import { DeleteListingCommand } from '@modules/listing-management/application/commands/delete-listing.command';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { createListingSchema } from '@modules/listing-management/presentation/dto/create-listing.dto';
import { updateListingSchema } from '@modules/listing-management/presentation/dto/update-listing.dto';
import { deleteListingSchema } from '@modules/listing-management/presentation/dto/delete-listing.dto';
import type { CreateListingDto } from '@modules/listing-management/presentation/dto/create-listing.dto';
import type { UpdateListingDto } from '@modules/listing-management/presentation/dto/update-listing.dto';
import type { DeleteListingDto } from '@modules/listing-management/presentation/dto/delete-listing.dto';
import { LISTING_STATUS } from '@shared/constants/api.constants';

import { MOCK_AREA_ID, MOCK_SUBTYPE_ID } from '@test/fixtures/factories';

const LISTING_UUID = '00000000-0000-4000-8000-000000000001';
const OWNER_UUID = '00000000-0000-4000-8000-000000000002';

@Controller('listings')
class MockListingsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createListingSchema)) dto: CreateListingDto) {
    return this.commandBus.execute(
      new CreateListingCommand({
        ...dto,
        ownerId: OWNER_UUID,
      }),
    );
  }

  @Patch()
  async update(@Body(new ZodValidationPipe(updateListingSchema)) dto: UpdateListingDto) {
    await this.commandBus.execute(
      new UpdateListingCommand({
        ...dto,
        ownerId: OWNER_UUID,
      }),
    );
    return { ok: true };
  }

  @Delete()
  async delete(@Body(new ZodValidationPipe(deleteListingSchema)) dto: DeleteListingDto) {
    await this.commandBus.execute(
      new DeleteListingCommand({
        ...dto,
        ownerId: OWNER_UUID,
      }),
    );
    return { ok: true };
  }
}

describe('ListingsController (e2e)', () => {
  let app: INestApplication;
  let commandBusExecute: jest.MockedFunction<(command: unknown) => Promise<unknown>>;

  beforeAll(async () => {
    commandBusExecute = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MockListingsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: commandBusExecute,
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
  });

  afterAll(async () => {
    await app.close();
  });

  const validCreatePayload = (): CreateListingDto =>
    createListingSchema.parse({
      title: 'Test Listing',
      purpose: 'SELL',
      propertyCategory: 'HOME',
      propertySubtypeId: MOCK_SUBTYPE_ID,
      areaId: MOCK_AREA_ID,
      locationText: 'DHA Phase 5, Karachi',
      areaValue: 5,
      areaUnit: 'MARLA',
      priceAmount: 100000,
      latitude: 24.86,
      longitude: 67.01,
    });

  describe('POST /listings', () => {
    it('should create a listing with valid data', async () => {
      commandBusExecute.mockResolvedValueOnce({
        id: LISTING_UUID,
      });

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(validCreatePayload())
        .expect(201);

      expect(response.body).toEqual({ id: LISTING_UUID });
      expect(commandBusExecute).toHaveBeenCalledWith(expect.any(CreateListingCommand));
    });

    it('should create a listing with optional fields', async () => {
      const payloadWithAllFields = {
        ...validCreatePayload(),
        description: 'Test Description',
        currency: 'PKR' as const,
      };

      commandBusExecute.mockResolvedValueOnce({
        id: LISTING_UUID,
      });

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(payloadWithAllFields)
        .expect(201);

      expect(response.body).toEqual({ id: LISTING_UUID });
    });

    it('should return 400 when title is missing', () => {
      const { title: _t, ...rest } = validCreatePayload();
      return request(app.getHttpServer()).post('/listings').send(rest).expect(400);
    });

    it('should return 400 when priceAmount is missing', () => {
      const { priceAmount: _p, ...rest } = validCreatePayload();
      return request(app.getHttpServer()).post('/listings').send(rest).expect(400);
    });

    it('should return 400 for invalid purpose', () => {
      const invalidPayload = {
        ...validCreatePayload(),
        purpose: 'INVALID',
      };
      return request(app.getHttpServer()).post('/listings').send(invalidPayload).expect(400);
    });

    it('should handle command bus errors', async () => {
      commandBusExecute.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app.getHttpServer())
        .post('/listings')
        .send(validCreatePayload())
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('PATCH /listings', () => {
    const validPayload: UpdateListingDto = {
      id: LISTING_UUID,
      title: 'Updated Title',
    };

    it('should update a listing with valid data', async () => {
      commandBusExecute.mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .patch('/listings')
        .send(validPayload)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
      expect(commandBusExecute).toHaveBeenCalledWith(expect.any(UpdateListingCommand));
    });

    it('should update a listing with optional fields', async () => {
      const payloadWithAllFields: UpdateListingDto = {
        id: LISTING_UUID,
        title: 'Updated Title',
        description: 'Updated Description',
        priceAmount: 150000,
        currency: 'PKR',
        propertyCategory: 'PLOT',
        status: 'PUBLISHED',
      };

      commandBusExecute.mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .patch('/listings')
        .send(payloadWithAllFields)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });

    it('should return 400 when id is missing', () => {
      const invalidPayload = {
        title: 'Updated Title',
      };

      return request(app.getHttpServer()).patch('/listings').send(invalidPayload).expect(400);
    });

    it('should return 400 for invalid status value', () => {
      const invalidPayload = {
        id: LISTING_UUID,
        status: 'INVALID_STATUS',
      };

      return request(app.getHttpServer()).patch('/listings').send(invalidPayload).expect(400);
    });

    it('should allow valid status values', async () => {
      for (const status of LISTING_STATUS) {
        const payload: UpdateListingDto = {
          id: LISTING_UUID,
          status,
        };

        commandBusExecute.mockResolvedValueOnce(undefined);

        await request(app.getHttpServer()).patch('/listings').send(payload).expect(200);
      }
    });

    it('should handle command bus errors', async () => {
      commandBusExecute.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app.getHttpServer())
        .patch('/listings')
        .send(validPayload)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('DELETE /listings', () => {
    const validPayload: DeleteListingDto = {
      id: LISTING_UUID,
    };

    it('should delete a listing with valid data', async () => {
      commandBusExecute.mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .delete('/listings')
        .send(validPayload)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
      expect(commandBusExecute).toHaveBeenCalledWith(expect.any(DeleteListingCommand));
    });

    it('should return 400 when id is missing', () => {
      const invalidPayload = {};

      return request(app.getHttpServer()).delete('/listings').send(invalidPayload).expect(400);
    });

    it('should handle command bus errors', async () => {
      commandBusExecute.mockRejectedValueOnce(new Error('Database error'));

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

    it('should reject empty body', () => {
      return request(app.getHttpServer()).post('/listings').send({}).expect(400);
    });
  });
});
