import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpExceptionFilter } from '../../../../common/filters/http-exception.filter';

describe('Users Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  beforeEach(async () => {
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createUserDto.name);
      expect(response.body.email).toBe(createUserDto.email);

      if (response.body.password) {
        expect(response.body.password).not.toBe(createUserDto.password);
      }

      const savedUser = await prismaService.user.findUnique({
        where: { email: createUserDto.email },
      });

      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(createUserDto.name);
      expect(savedUser.email).toBe(createUserDto.email);
      expect(savedUser.password).not.toBe(createUserDto.password);
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

      await request(app.getHttpServer())
        .post('/users')
        .send(existingUser)
        .expect(201);

      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Another User',
          email: 'existing@example.com',
          password: 'AnotherPassword1!',
        })
        .expect(409);
    });
  });

  describe('GET /users/:id', () => {
    it('should get a user by ID', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body.id;

      const getResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', userId);
      expect(getResponse.body.name).toBe(createUserDto.name);
      expect(getResponse.body.email).toBe(createUserDto.email);

      if (getResponse.body.password) {
        expect(getResponse.body.password).not.toBe(createUserDto.password);
      }
    });

    it('should return 404 for a non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/users/nonexistent-id')
        .expect(404);
    });
  });

  describe('GET /users/email/:email', () => {
    it('should get a user by email', async () => {
      const createUserDto = {
        name: 'Email Test User',
        email: 'email-test@example.com',
        password: 'Password1!',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const getResponse = await request(app.getHttpServer())
        .get(`/users/email/${createUserDto.email}`)
        .expect(200);

      expect(getResponse.body.name).toBe(createUserDto.name);
      expect(getResponse.body.email).toBe(createUserDto.email);
    });

    it('should return 404 for a non-existent email', async () => {
      await request(app.getHttpServer())
        .get('/users/email/nonexistent@example.com')
        .expect(404);
    });
  });

  describe('GET /users', () => {
    it('should get the list of users', async () => {
      const users = [
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'Password1!',
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'Password2!',
        },
      ];

      for (const user of users) {
        await request(app.getHttpServer())
          .post('/users')
          .send(user)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      const emails = response.body.map((u: any) => u.email);
      expect(emails).toContain('user1@example.com');
      expect(emails).toContain('user2@example.com');
    });
  });
});
