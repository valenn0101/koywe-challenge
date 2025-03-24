import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../services/auth.service';
import { UsersFacade } from '../../../../users/services/users.facade';
import { CreateUserDto } from '../../../../users/dto/create-user.dto';
import { UserEntity } from '../../../../users/entities/user.entity';
import { UserAlreadyExistsException } from '../../../../users/exceptions/user-exceptions';
import {
  AuthenticationFailedException,
  InvalidTokenException,
  UnauthorizedException,
} from '../../../exceptions/auth-exceptions';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersFacade: UsersFacade;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersFacade = {
    create: jest.fn(),
    findOne: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersFacade,
          useValue: mockUsersFacade,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersFacade = module.get<UsersFacade>(UsersFacade);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-secret-key');
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockUser = new UserEntity({
      id: 1,
      email: loginData.email,
      password: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should login user and return tokens', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      mockUsersFacade.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUsersFacade.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginData.email, loginData.password);

      expect(result).toEqual(mockTokens);
      expect(usersFacade.findOne).toHaveBeenCalledWith({
        email: loginData.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password,
      );
    });

    it('should throw AuthenticationFailedException when the password is incorrect', async () => {
      mockUsersFacade.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginData.email, 'wrongpassword'),
      ).rejects.toThrow(AuthenticationFailedException);

      expect(usersFacade.findOne).toHaveBeenCalledWith({
        email: loginData.email,
      });
    });

    it('should throw AuthenticationFailedException when the user does not exist', async () => {
      mockUsersFacade.findOne.mockRejectedValue(new Error());

      await expect(
        service.login(loginData.email, loginData.password),
      ).rejects.toThrow(AuthenticationFailedException);
    });
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockUser = new UserEntity({
      id: 1,
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should register a new user and return tokens', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      mockUsersFacade.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUsersFacade.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.register(createUserDto);

      expect(result).toEqual(mockTokens);
      expect(usersFacade.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw UserAlreadyExistsException when the user already exists', async () => {
      const error = new UserAlreadyExistsException(createUserDto.email);
      mockUsersFacade.create.mockRejectedValue(error);

      await expect(service.register(createUserDto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      expect(usersFacade.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw AuthenticationFailedException in case of general error', async () => {
      mockUsersFacade.create.mockRejectedValue(new Error());

      await expect(service.register(createUserDto)).rejects.toThrow(
        AuthenticationFailedException,
      );
      expect(usersFacade.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid_refresh_token';
    const mockUser = new UserEntity({
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      refreshToken: refreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockPayload = {
      sub: mockUser.id,
      email: mockUser.email,
    };

    it('should refresh tokens when the data is valid', async () => {
      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockUsersFacade.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUsersFacade.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual(mockTokens);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-secret-key',
      });
      expect(usersFacade.findOne).toHaveBeenCalledWith({
        id: mockUser.id,
      });
    });

    it('should throw InvalidTokenException when the email does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockUsersFacade.findOne.mockResolvedValue({
        ...mockUser,
        email: 'different@example.com',
      });

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        InvalidTokenException,
      );
    });

    it('should throw InvalidTokenException when the refresh token does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockUsersFacade.findOne.mockResolvedValue({
        ...mockUser,
        refreshToken: 'different_token',
      });

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        InvalidTokenException,
      );
    });

    it('should throw UnauthorizedException when the user does not exist', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockUsersFacade.findOne.mockRejectedValue(new Error());

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
