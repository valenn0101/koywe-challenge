import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../database/prisma.service';
import { CreateUserDto } from '../../../users/dto/create-user.dto';
import { LoginDto } from '../../../auth/dto/login.dto';
import { RefreshTokenDto } from '../../../auth/dto/refresh-token.dto';
import { UserEntity } from '../../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prismaService.quote.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    await prismaService.quote.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('POST /auth/register', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully register a new user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', createUserDto.email);
      expect(response.body.user).toHaveProperty('name', createUserDto.name);

      const user = await prismaService.user.findUnique({
        where: { email: createUserDto.email },
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe(createUserDto.name);
      expect(user?.email).toBe(createUserDto.email);
      expect(user?.refreshToken).toBeDefined();
    });

    it('should return 409 when user already exists', async () => {
      await prismaService.user.create({
        data: {
          ...createUserDto,
          password: await bcrypt.hash(createUserDto.password, 10),
        },
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(409);
    });

    it('should return 400 when password is invalid', async () => {
      const invalidUserDto = {
        ...createUserDto,
        password: 'weak',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);

      expect(response.body.message).toBe('Contraseña insegura');
    });
  });

  describe('POST /auth/login', () => {
    const loginData: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(loginData.password, 10);
      await prismaService.user.create({
        data: {
          name: 'Test User',
          email: loginData.email,
          password: hashedPassword,
        },
      });
    });

    it('should login user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', loginData.email);
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('should return 401 when password is incorrect', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...loginData,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 when user does not exist', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...loginData,
          email: 'nonexistent@example.com',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const user = await prismaService.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens when data is valid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('should return 401 when refresh token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);
    });

    it('should return 401 when refresh token is expired', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDY0ODAwMCwiZXhwIjoxNzAwNjQ4MDAxfQ.4Adcj3UFYzPUVaVF43FmMze6JcZpsdaAJkYyrw1Z7uE';

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);
    });
  });
});
