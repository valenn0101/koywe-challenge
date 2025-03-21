import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpExceptionFilter } from '../../../../common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';

describe('Users Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let validToken: string;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = app.get<JwtService>(JwtService);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    prismaService = app.get<PrismaService>(PrismaService);

    // Generar un token válido para las pruebas
    validToken = jwtService.sign({ sub: 1, email: 'test@example.com' });

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaService.user.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/:id', () => {
    it('should get a user by ID', async () => {
      const userId = '1';
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        createdAt: user.createdAt.toISOString(),
        id: userId,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt.toISOString(),
      });
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/users/1').expect(401);
    });

    it('should return 404 for a non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/users/nonexistent-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('GET /users/email/:email', () => {
    it('should get a user by email', async () => {
      const user = {
        id: '1',
        name: 'Email Test User',
        email: 'email-test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);

      const response = await request(app.getHttpServer())
        .get(`/users/email/${user.email}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        createdAt: user.createdAt.toISOString(),
        id: user.id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt.toISOString(),
      });
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/users/email/test@example.com')
        .expect(401);
    });

    it('should return 404 for a non-existent email', async () => {
      await request(app.getHttpServer())
        .get('/users/email/nonexistent@example.com')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('GET /users', () => {
    it('should get the list of users', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          password: 'hashed_password1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          password: 'hashed_password2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValueOnce(mockUsers);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual(
        mockUsers.map(({ password, ...user }) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })),
      );
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });
  });
});
