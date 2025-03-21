import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../services/users.service';
import { UsersRepository } from '../../../repositories/users.repository';
import { UserEntity } from '../../../entities/user.entity';
import { CreateUserDto } from '../../../dto/create-user.dto';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  PasswordValidationException,
} from '../../../exceptions/user-exceptions';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUsersRepository = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
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

      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 'salt');
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashed_password',
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw UserAlreadyExistsException when the email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'Password1!',
      };

      const existingUser = new UserEntity({
        id: 1,
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUsersRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });

    it('should throw PasswordValidationException when the password does not meet the requirements', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      };

      await expect(service.create(createUserDto)).rejects.toThrow(
        PasswordValidationException,
      );
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a user by ID', async () => {
      const userId = 1;
      const expectedUser = new UserEntity({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUsersRepository.findById.mockResolvedValue(expectedUser);

      const result = await service.findOne({ id: userId });

      expect(mockUsersRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });

    it('should find a user by email', async () => {
      const userEmail = 'test@example.com';
      const expectedUser = new UserEntity({
        id: 1,
        name: 'Test User',
        email: userEmail,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUsersRepository.findByEmail.mockResolvedValue(expectedUser);

      const result = await service.findOne({ email: userEmail });

      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(userEmail);
      expect(result).toEqual(expectedUser);
    });

    it('should throw UserNotFoundException when the user is not found', async () => {
      const userId = 99;

      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.findOne({ id: userId })).rejects.toThrow(
        UserNotFoundException,
      );
      expect(mockUsersRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
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

      mockUsersRepository.findAll.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      expect(mockUsersRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });

    it('should return an empty array when there are no users', async () => {
      mockUsersRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(mockUsersRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
