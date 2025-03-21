import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../entities/user.entity';
import { UsersRepository } from '../repositories/users.repository';
import * as bcrypt from 'bcrypt';
import {
  UserAlreadyExistsException,
  PasswordHashFailedException,
  IncompleteFormDataException,
  PasswordValidationException,
} from '../exceptions/user-exceptions';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      this.validateRequiredFields(createUserDto);

      this.validatePasswordSecurity(createUserDto.password);

      const existingUser = await this.usersRepository.findByEmail(
        createUserDto.email,
      );

      if (existingUser) {
        throw new UserAlreadyExistsException(createUserDto.email);
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      return this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });
    } catch (error) {
      this.logger.error(
        `Error al crear usuario: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof UserAlreadyExistsException ||
        error instanceof IncompleteFormDataException ||
        error instanceof PasswordValidationException
      ) {
        throw error;
      }

      if (error.name === 'BcryptError') {
        throw new PasswordHashFailedException();
      }

      throw error;
    }
  }

  private validateRequiredFields(data: CreateUserDto): void {
    const missingFields = [];

    if (!data.name?.trim()) missingFields.push('name');
    if (!data.email?.trim()) missingFields.push('email');
    if (!data.password?.trim()) missingFields.push('password');

    if (missingFields.length > 0) {
      throw new IncompleteFormDataException(missingFields);
    }
  }

  private validatePasswordSecurity(password: string): void {
    const minLength = 8;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );

    if (password.length < minLength || !hasSpecialChar) {
      throw new PasswordValidationException();
    }
  }
}
