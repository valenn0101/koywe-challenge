import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpExceptionFilter } from '../../../../common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Currency } from '../../interfaces/currency.enum';
import { EXCHANGE_RATE_API } from '../../infrastructure/api/exchange-rate-api.interface';
import { AuthGuard } from '../../../auth/guards/auth.guard';

class MockAuthGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();

    if (request.headers.authorization) {
      const [type, token] = request.headers.authorization.split(' ');
      if (type === 'Bearer' && token) {
        request.user = { id: 1, email: 'test@example.com' };
        return true;
      }
    }

    return false;
  }
}

describe('Quotes Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let accessToken: string;

  const mockPrismaService = {
    quote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET_KEY: 'test-secret-key',
        CRYPTO_MARKET_API_URL: 'https://api.test.com',
      };
      return config[key];
    }),
  };

  const mockExchangeRateApi = {
    getExchangeRate: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(EXCHANGE_RATE_API)
      .useValue(mockExchangeRateApi)
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
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
    jwtService = app.get<JwtService>(JwtService);

    accessToken = 'test-token';

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaService.quote.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /quote', () => {
    const validQuoteDto = {
      amount: 1000000,
      from: Currency.ARS,
      to: Currency.ETH,
    };

    it('should create a quote successfully when authenticated', async () => {
      const mockRate = 0.0000023;
      const mockConvertedAmount = validQuoteDto.amount * mockRate;

      const mockQuote = {
        id: 1,
        from: validQuoteDto.from,
        to: validQuoteDto.to,
        amount: validQuoteDto.amount,
        rate: mockRate,
        convertedAmount: mockConvertedAmount,
        timestamp: new Date(),
        expiresAt: new Date(new Date().getTime() + 5 * 60000),
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
      });

      mockExchangeRateApi.getExchangeRate.mockResolvedValue(mockRate);

      mockPrismaService.quote.create.mockResolvedValue(mockQuote);

      const response = await request(app.getHttpServer())
        .post('/quote')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validQuoteDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toEqual(mockQuote.id);
      expect(response.body.from).toEqual(validQuoteDto.from);
      expect(response.body.to).toEqual(validQuoteDto.to);
      expect(response.body.amount).toEqual(validQuoteDto.amount);
      expect(response.body.convertedAmount).toEqual(mockConvertedAmount);
      expect(mockExchangeRateApi.getExchangeRate).toHaveBeenCalledWith(
        validQuoteDto.from,
        validQuoteDto.to,
      );
      expect(mockPrismaService.quote.create).toHaveBeenCalled();
    });

    it('should return 403 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/quote')
        .send(validQuoteDto)
        .expect(403);

      expect(mockExchangeRateApi.getExchangeRate).not.toHaveBeenCalled();
      expect(mockPrismaService.quote.create).not.toHaveBeenCalled();
    });

    it('should return 400 when request data is invalid', async () => {
      const invalidQuoteDto = {
        amount: 'not-a-number',
        from: 'INVALID',
        to: Currency.ETH,
      };

      await request(app.getHttpServer())
        .post('/quote')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidQuoteDto)
        .expect(400);

      expect(mockExchangeRateApi.getExchangeRate).not.toHaveBeenCalled();
      expect(mockPrismaService.quote.create).not.toHaveBeenCalled();
    });

    it('should return 400 when currencies are the same', async () => {
      const sameQuoteDto = {
        amount: 1000,
        from: Currency.ETH,
        to: Currency.ETH,
      };

      await request(app.getHttpServer())
        .post('/quote')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sameQuoteDto)
        .expect(400);

      expect(mockExchangeRateApi.getExchangeRate).not.toHaveBeenCalled();
      expect(mockPrismaService.quote.create).not.toHaveBeenCalled();
    });

    it('should return 500 when exchange rate API fails', async () => {
      mockExchangeRateApi.getExchangeRate.mockRejectedValue(
        new Error('API error'),
      );

      await request(app.getHttpServer())
        .post('/quote')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validQuoteDto)
        .expect(500);

      expect(mockExchangeRateApi.getExchangeRate).toHaveBeenCalled();
      expect(mockPrismaService.quote.create).not.toHaveBeenCalled();
    });
  });
});
