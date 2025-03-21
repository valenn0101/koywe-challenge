import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpExceptionFilter } from '../../../../common/filters/http-exception.filter';
import { CreateUserDto } from '../../../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('Auth Integration Tests', () => {
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

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET_KEY: 'test-secret-key',
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
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

  describe('POST /auth/register', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully register a new user and return tokens', async () => {
      const mockCreatedUser = {
        id: 1,
        email: createUserDto.email,
        name: createUserDto.name,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValueOnce(mockCreatedUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: 'hashed_password',
        },
      });
    });

    it('should return 400 when validation fails', async () => {
      const invalidUserDto = {
        name: 'Test User',
        email: 'invalid-email',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should return 409 when user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: createUserDto.email,
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user and return tokens', async () => {
      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid credentials', async () => {
      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 400 with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...loginData, email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    const refreshData = {
      userId: 1,
      email: 'test@example.com',
    };

    it('should refresh tokens when data is valid', async () => {
      const mockUser = {
        id: refreshData.userId,
        email: refreshData.email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshData)
        .expect(401);
    });

    it('should return 401 when email does not match', async () => {
      const mockUser = {
        id: refreshData.userId,
        email: 'different@example.com',
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshData)
        .expect(401);
    });
  });
});
