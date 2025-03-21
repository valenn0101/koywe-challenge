import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../../users/services/users.service';
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
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
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
    usersService = module.get<UsersService>(UsersService);
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
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      const result = await service.login(loginData.email, loginData.password);

      expect(result).toEqual(mockTokens);
      expect(usersService.findOne).toHaveBeenCalledWith({
        email: loginData.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password,
      );
    });

    it('should throw AuthenticationFailedException when the password is incorrect', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginData.email, 'wrongpassword'),
      ).rejects.toThrow(AuthenticationFailedException);

      expect(usersService.findOne).toHaveBeenCalledWith({
        email: loginData.email,
      });
    });

    it('should throw AuthenticationFailedException when the user does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error());

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
      };

      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      const result = await service.register(createUserDto);

      expect(result).toEqual(mockTokens);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw UserAlreadyExistsException when the user already exists', async () => {
      const error = new UserAlreadyExistsException(createUserDto.email);
      mockUsersService.create.mockRejectedValue(error);

      await expect(service.register(createUserDto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw AuthenticationFailedException in case of general error', async () => {
      mockUsersService.create.mockRejectedValue(new Error());

      await expect(service.register(createUserDto)).rejects.toThrow(
        AuthenticationFailedException,
      );
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('refreshTokens', () => {
    const refreshData = {
      userId: 1,
      email: 'test@example.com',
    };

    const mockUser = new UserEntity({
      id: refreshData.userId,
      email: refreshData.email,
      password: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should refresh tokens when the data is valid', async () => {
      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      const result = await service.refreshTokens(
        refreshData.userId,
        refreshData.email,
      );

      expect(result).toEqual(mockTokens);
      expect(usersService.findOne).toHaveBeenCalledWith({
        id: refreshData.userId,
      });
    });

    it('should throw InvalidTokenException when the email does not match', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(
        service.refreshTokens(refreshData.userId, 'wrong@example.com'),
      ).rejects.toThrow(InvalidTokenException);

      expect(usersService.findOne).toHaveBeenCalledWith({
        id: refreshData.userId,
      });
    });

    it('should throw UnauthorizedException when the user does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error());

      await expect(
        service.refreshTokens(refreshData.userId, refreshData.email),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findOne).toHaveBeenCalledWith({
        id: refreshData.userId,
      });
    });
  });

  describe('generateTokens', () => {
    const tokenData = {
      userId: 1,
      email: 'test@example.com',
    };

    it('should generate access token and refresh token', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };

      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      const result = await service['generateTokens'](
        tokenData.userId,
        tokenData.email,
      );

      expect(result).toEqual(mockTokens);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET_KEY');
    });

    it('should throw AuthenticationFailedException when token generation fails', async () => {
      mockJwtService.signAsync.mockRejectedValue(new Error());

      await expect(
        service['generateTokens'](tokenData.userId, tokenData.email),
      ).rejects.toThrow(AuthenticationFailedException);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET_KEY');
    });
  });
});
