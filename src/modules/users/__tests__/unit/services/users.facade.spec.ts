import { Test, TestingModule } from '@nestjs/testing';
import { UsersFacade } from '../../../services/users.facade';
import { UsersService } from '../../../services/users.service';
import { UserEntity } from '../../../entities/user.entity';
import { CreateUserDto } from '../../../dto/create-user.dto';

describe('UsersFacade', () => {
  let facade: UsersFacade;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersFacade,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    facade = module.get<UsersFacade>(UsersFacade);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call usersService.create and return the result', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
      };

      const expectedUser = new UserEntity({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUsersService.create.mockResolvedValue(expectedUser);

      const result = await facade.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne and return the result', async () => {
      const userId = 1;
      const expectedUser = new UserEntity({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUsersService.findOne.mockResolvedValue(expectedUser);

      const result = await facade.findOne({ id: userId });

      expect(mockUsersService.findOne).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return the result', async () => {
      const expectedUsers = [
        new UserEntity({
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          password: 'hashed_password',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new UserEntity({
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          password: 'hashed_password',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockUsersService.findAll.mockResolvedValue(expectedUsers);

      const result = await facade.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('updateRefreshToken', () => {
    it('should call usersService.updateRefreshToken and return the result', async () => {
      const userId = 1;
      const refreshToken = 'refresh_token';
      const expectedUser = new UserEntity({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        refreshToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUsersService.updateRefreshToken.mockResolvedValue(expectedUser);

      const result = await facade.updateRefreshToken(userId, refreshToken);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        userId,
        refreshToken,
      );
      expect(result).toEqual(expectedUser);
    });
  });
});
