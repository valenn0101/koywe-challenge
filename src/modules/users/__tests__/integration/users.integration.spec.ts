import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpExceptionFilter } from '../../../../common/filters/http-exception.filter';

describe('Users Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaService.user.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
      };

      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        name: createUserDto.name,
        email: createUserDto.email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createUserDto.name);
      expect(response.body.email).toBe(createUserDto.email);

      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should reject the creation with invalid data', async () => {
      const invalidUser = {
        name: '',
        email: 'invalid-email',
        password: 'weak',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('message', 'Error de validación');

      expect(response.body).toBeDefined();
    });

    it('should reject the creation of a user with an existing email', async () => {
      const existingUser = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'Password1!',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: '1',
        ...existingUser,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await request(app.getHttpServer())
        .post('/users')
        .send(existingUser)
        .expect(409);
    });
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
        .expect(200);

      expect(response.body).toEqual({
        createdAt: user.createdAt.toISOString(),
        id: userId,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt.toISOString(),
      });
    });

    it('should return 404 for a non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/users/nonexistent-id')
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
        .expect(200);

      expect(response.body).toEqual({
        createdAt: user.createdAt.toISOString(),
        id: user.id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt.toISOString(),
      });
    });

    it('should return 404 for a non-existent email', async () => {
      await request(app.getHttpServer())
        .get('/users/email/nonexistent@example.com')
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
        .expect(200);

      expect(response.body).toEqual(
        mockUsers.map(({ password, ...user }) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })),
      );
    });
  });
});
