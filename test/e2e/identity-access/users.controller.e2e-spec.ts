import { Controller, Get, Session } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('users')
class MockUsersController {
  @Get('me')
  me(@Session() session?: UserSession) {
    return { user: session?.user };
  }

  @Get('public')
  publicRoute() {
    return { ok: true };
  }

  @Get('optional')
  optional(@Session() session?: UserSession) {
    return { authenticated: !!session };
  }
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let mockSession: UserSession;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MockUsersController],
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

    mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        image: null,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: 'test-session-id',
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        token: 'test-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      },
    };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/public', () => {
    it('should return ok: true for public endpoint', () => {
      return request(app.getHttpServer())
        .get('/users/public')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });

    it('should not require authentication', () => {
      return request(app.getHttpServer())
        .get('/users/public')
        .set('Authorization', 'invalid-token')
        .expect(200);
    });
  });

  describe('GET /users/optional', () => {
    it('should return authenticated: false when no session', () => {
      return request(app.getHttpServer())
        .get('/users/optional')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ authenticated: false });
        });
    });
  });

  describe('GET /users/me', () => {
    it('should return user data when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('x-session', JSON.stringify(mockSession));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    it('should handle missing session gracefully', async () => {
      const response = await request(app.getHttpServer()).get('/users/me');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeUndefined();
    });
  });

  describe('Request Validation', () => {
    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .get('/users/public')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should handle large payloads', () => {
      return request(app.getHttpServer())
        .post('/users/me')
        .send({ data: 'x'.repeat(10000) })
        .expect(404);
    });
  });
});
