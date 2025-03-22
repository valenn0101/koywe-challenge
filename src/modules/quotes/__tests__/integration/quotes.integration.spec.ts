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

  describe('GET /quote/:id', () => {
    const quoteId = 1;
    const userId = 1;

    const mockQuote = {
      id: quoteId,
      from: Currency.ARS,
      to: Currency.ETH,
      amount: 1000000,
      rate: 0.0000023,
      convertedAmount: 2.3,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return a quote when it exists and is not expired', async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);

      const response = await request(app.getHttpServer())
        .get(`/quote/${quoteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toEqual(mockQuote.id);
      expect(response.body.from).toEqual(mockQuote.from);
      expect(response.body.to).toEqual(mockQuote.to);
      expect(response.body.amount).toEqual(mockQuote.amount);
      expect(response.body.rate).toEqual(mockQuote.rate);
      expect(response.body.convertedAmount).toEqual(mockQuote.convertedAmount);
      expect(mockPrismaService.quote.findUnique).toHaveBeenCalledWith({
        where: { id: quoteId },
      });
    });

    it('should return 404 when quote does not exist', async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/quote/${quoteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(mockPrismaService.quote.findUnique).toHaveBeenCalledWith({
        where: { id: quoteId },
      });
    });

    it('should return 404 when quote is expired', async () => {
      const expiredQuote = {
        ...mockQuote,
        expiresAt: new Date(new Date().getTime() - 60000),
      };

      mockPrismaService.quote.findUnique.mockResolvedValue(expiredQuote);

      await request(app.getHttpServer())
        .get(`/quote/${quoteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(mockPrismaService.quote.findUnique).toHaveBeenCalledWith({
        where: { id: quoteId },
      });
    });

    it('should return 403 when not authenticated', async () => {
      await request(app.getHttpServer()).get(`/quote/${quoteId}`).expect(403);

      expect(mockPrismaService.quote.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 when quoteId is not a number', async () => {
      await request(app.getHttpServer())
        .get('/quote/not-a-number')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(mockPrismaService.quote.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('GET /quote/currencies/all', () => {
    it('should return all available currencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/quote/currencies/all')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body).toEqual(Object.values(Currency));
      expect(response.body.length).toEqual(Object.values(Currency).length);
    });

    it('should not require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/quote/currencies/all')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe('GET /quote/user/all', () => {
    const userId = 1;

    const mockQuotes = [
      {
        id: 1,
        from: Currency.ARS,
        to: Currency.ETH,
        amount: 1000000,
        rate: 0.0000023,
        convertedAmount: 2.3,
        timestamp: new Date(),
        expiresAt: new Date(new Date().getTime() + 5 * 60000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        from: Currency.ETH,
        to: Currency.BTC,
        amount: 1,
        rate: 0.05,
        convertedAmount: 0.05,
        timestamp: new Date(),
        expiresAt: new Date(new Date().getTime() + 5 * 60000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all quotes for the authenticated user', async () => {
      mockPrismaService.quote.findMany.mockResolvedValue(mockQuotes);

      const response = await request(app.getHttpServer())
        .get('/quote/user/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(mockQuotes.length);
      expect(response.body[0].id).toEqual(mockQuotes[0].id);
      expect(response.body[1].id).toEqual(mockQuotes[1].id);

      expect(mockPrismaService.quote.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return empty array when user has no quotes', async () => {
      mockPrismaService.quote.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/quote/user/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(0);

      expect(mockPrismaService.quote.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return 403 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/quote/user/all').expect(403);

      expect(mockPrismaService.quote.findMany).not.toHaveBeenCalled();
    });
  });
});
