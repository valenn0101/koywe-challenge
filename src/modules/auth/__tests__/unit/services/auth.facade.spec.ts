import { Test, TestingModule } from '@nestjs/testing';
import { AuthFacade } from '../../../services/auth.facade';
import { AuthService } from '../../../services/auth.service';
import { CreateUserDto } from '../../../../users/dto/create-user.dto';
import { Tokens } from '../../../interfaces/tokens.interface';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthFacade,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    facade = module.get<AuthFacade>(AuthFacade);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      const mockTokens: Tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: 1,
          email,
          name: 'Test User',
        },
      };

      mockAuthService.login.mockResolvedValue(mockTokens);

      const result = await facade.login(email, password);

      expect(mockAuthService.login).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockTokens: Tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: 1,
          email: createUserDto.email,
          name: createUserDto.name,
        },
      };

      mockAuthService.register.mockResolvedValue(mockTokens);

      const result = await facade.register(createUserDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshTokens and return the result', async () => {
      const refreshToken = 'refresh_token';

      const mockTokens: Tokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await facade.refreshTokens(refreshToken);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockTokens);
    });
  });
});
