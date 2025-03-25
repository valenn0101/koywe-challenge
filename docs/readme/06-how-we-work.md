# How We Work

## Architecture

Our project implements a modular architecture inspired by Hexagonal Architecture (Ports and Adapters) principles. This architecture separates the application into distinct layers, allowing for better separation of concerns, testability, and maintainability.

### Modular Structure

The application is organized into domain-focused modules, each containing its own:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data persistence
- **DTOs**: Define data transfer objects
- **Entities**: Represent domain models
- **Interfaces**: Define contracts between layers
- **Exceptions**: Handle domain-specific errors

Here's the overall project structure:

```
src/
├── modules/                # Domain modules
│   ├── auth/              # Authentication module
│   ├── quotes/            # Quotes module
│   └── users/             # Users module
├── common/                # Shared utilities
├── database/              # Database configuration
└── main.ts                # Application entry point
```

Inside each module, we maintain a consistent structure:

```
quotes/
├── controllers/           # HTTP request handlers
├── services/              # Business logic
├── repositories/          # Data access
├── dto/                   # Data transfer objects
├── entities/              # Domain entities
├── exceptions/            # Domain-specific exceptions
├── infrastructure/        # External interfaces (API clients, etc.)
├── interfaces/            # Contracts and types
├── __tests__/             # Tests
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
└── quotes.module.ts       # Module definition
```

### Facade Pattern Implementation

We've implemented the Facade pattern to simplify interactions between controllers and complex service layer operations:

- **QuotesFacade**: Provides a simplified interface to the QuotesService functionality
- Each Facade method delegates to the appropriate service method, creating a clean abstraction layer
- This pattern reduces dependencies between controllers and services, making the codebase more maintainable

**Example implementation:**

```typescript
// quotes.facade.ts
@Injectable()
export class QuotesFacade {
  constructor(private readonly quotesService: QuotesService) {}

  async createQuote(
    createQuoteDto: CreateQuoteDto,
    userId: number,
  ): Promise<IQuoteResponse> {
    return this.quotesService.createQuote(createQuoteDto, userId);
  }

  async getQuoteById(id: number): Promise<IQuoteResponse | null> {
    return this.quotesService.getQuoteById(id);
  }

  async getAllCurrencies(): Promise<Currency[]> {
    return this.quotesService.getAllCurrencies();
  }

  async getUserQuotes(userId: number): Promise<QuoteEntity[]> {
    return this.quotesService.getUserQuotes(userId);
  }

  async deleteQuote(id: number): Promise<void> {
    return this.quotesService.deleteQuote(id);
  }
}
```

**Usage in controller:**

```typescript
// quotes.controller.ts
@ApiTags('Cotizaciones')
@ApiBearerAuth()
@Controller('quote')
export class QuotesController {
  constructor(private readonly quotesFacade: QuotesFacade) {}

  @Post()
  @ApiCreateQuote()
  @UseGuards(AuthGuard)
  async create(@Body() createQuoteDto: CreateQuoteDto, @Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'No se pudo determinar el ID del usuario',
      );
    }

    return this.quotesFacade.createQuote(createQuoteDto, userId);
  }
  
  // Other controller methods...
}
```

### Dependency Injection

The application uses NestJS's dependency injection system to manage dependencies, following SOLID principles:

- **Interface-based programming**: Using interfaces like `IExchangeRateApi` for loosely coupled components
- **Dependency inversion**: High-level modules don't depend on low-level modules but on abstractions
- **Providers**: Configured in module files, making dependencies explicit and testable

**Example interface:**

```typescript
// exchange-rate-api.interface.ts
import { Currency } from '../../interfaces/currency.enum';

export const EXCHANGE_RATE_API = 'EXCHANGE_RATE_API';

export interface IExchangeRateApi {
  getExchangeRate(
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<number>;
}
```

**Provider registration:**

```typescript
// quotes.module.ts
@Module({
  imports: [ConfigModule],
  controllers: [QuotesController],
  providers: [
    QuotesService,
    QuotesFacade,
    QuotesRepository,
    PrismaService,
    ExchangeRateApiProvider,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [QuotesFacade],
})
export class QuotesModule {}
```

## Testing Strategy

Our testing approach is comprehensive, covering both unit and integration tests:

### Unit Tests

- Test individual components in isolation
- Mock external dependencies
- Located in `__tests__/unit` folders within each module
- Cover services, repositories, facades, and API integrations

**Example unit test for a facade:**

```typescript
// quotes.facade.spec.ts
describe('QuotesFacade', () => {
  let facade: QuotesFacade;
  let service: QuotesService;

  const mockQuotesService = {
    createQuote: jest.fn(),
    getQuoteById: jest.fn(),
    getAllCurrencies: jest.fn(),
    getUserQuotes: jest.fn(),
    deleteQuote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesFacade,
        {
          provide: QuotesService,
          useValue: mockQuotesService,
        },
      ],
    }).compile();

    facade = module.get<QuotesFacade>(QuotesFacade);
    service = module.get<QuotesService>(QuotesService);

    jest.clearAllMocks();
  });

  describe('getQuoteById', () => {
    const quoteId = 1;
    const mockQuoteResponse: IQuoteResponse = {
      id: quoteId,
      from: Currency.ARS,
      to: Currency.ETH,
      amount: 1000000,
      rate: 0.0000023,
      convertedAmount: 2.3,
      timestamp: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60000),
    };

    it('should delegate to QuotesService.getQuoteById and return the result', async () => {
      mockQuotesService.getQuoteById.mockResolvedValue(mockQuoteResponse);

      const result = await facade.getQuoteById(quoteId);

      expect(result).toEqual(mockQuoteResponse);
      expect(mockQuotesService.getQuoteById).toHaveBeenCalledWith(quoteId);
    });
  });
});
```

### Integration Tests

- Verify different parts of the application work correctly together
- Located in `__tests__/integration` folders
- Test API endpoints, authentication flows, and end-to-end scenarios
- Use mocked database services to avoid external dependencies

## Database Choice: PostgreSQL vs MongoDB

We chose PostgreSQL with Prisma ORM over MongoDB with Mongoose for several reasons:

### Advantages of PostgreSQL for this Project

1. **Relational Data Structure**: Our domain model involves clear relationships between entities (Users and Quotes), which maps naturally to a relational database structure.

2. **ACID Compliance**: PostgreSQL provides strong transactional guarantees, ensuring data integrity for financial-related operations like quote generation.

3. **Type Safety**: PostgreSQL's strict schema enforcement, combined with Prisma's type generation, provides robust type safety across the entire application stack.

4. **Performance for Complex Queries**: For reporting features and potentially complex queries on quotes, PostgreSQL's query optimization offers better performance.

5. **Scalability Needs**: For our current scale, PostgreSQL provides sufficient scalability, while offering superior query capabilities compared to MongoDB.

**Prisma schema example:**

```prisma
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  refreshToken String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  quotes    Quote[]
}

model Quote {
  id              Int   @id @default(autoincrement())
  from            String
  to              String
  amount          Float
  rate            Float
  convertedAmount Float
  timestamp       DateTime @default(now())
  expiresAt       DateTime
  userId          Int
  user            User     @relation(fields: [userId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
}
```

### Prisma Benefits

- **Type Safety**: Auto-generated TypeScript types from the database schema
- **Migration Management**: Easy schema evolution with versioned migrations
- **Query Building**: Intuitive and type-safe query API
- **Relationship Handling**: Simplified handling of relations between entities

## Authentication Implementation

Our authentication system implements a secure refresh token mechanism:

### JWT Token Strategy

- **Access Token**: Short-lived (20 minutes) for API authentication
- **Refresh Token**: Long-lived (7 days) for obtaining new access tokens

### Enhanced Security Features

We implemented a secure refresh token validation process that includes:

1. **Database-Stored Refresh Tokens**: Each refresh token is stored in the user record
2. **Token Verification**: Every refresh request requires:
   - Valid JWT signature verification
   - Matching the stored token in the database
   - User existence verification
   - Email match validation

**Implementation example:**

```typescript
// auth.service.ts
async refreshTokens(refreshToken: string): Promise<Tokens> {
  try {
    const payload = await this.verifyRefreshToken(refreshToken);
    const userId = payload.sub;
    const email = payload.email;

    const user = await this.usersService.findOne({ id: userId });

    if (user.email !== email) {
      throw new InvalidTokenException();
    }

    if (user.refreshToken !== refreshToken) {
      throw new InvalidTokenException();
    }

    return this.generateTokens(user);
  } catch (error) {
    if (error instanceof UserNotFoundException) {
      throw new InvalidTokenException();
    }

    if (error instanceof InvalidTokenException) {
      throw error;
    }
    throw new UnauthorizedException();
  }
}

private async generateTokens(user: UserEntity): Promise<Tokens> {
  const jwtPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
  };

  try {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: '20m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: '7d',
      }),
    ]);

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    throw new AuthenticationFailedException('Error al generar los tokens');
  }
}
```

This approach provides several security benefits:

- **Revocation Capability**: Administrators can invalidate all sessions by clearing stored refresh tokens
- **Token Rotation**: New refresh tokens are issued with each refresh, limiting the damage from stolen tokens
- **Prevention of Replay Attacks**: Using the same refresh token twice is prevented by token validation
- **Isolation of Compromised Accounts**: If one user's tokens are compromised, other users remain secure

This implementation provides better security compared to a stateless JWT approach where tokens cannot be invalidated until they expire naturally.
