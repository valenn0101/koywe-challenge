import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { FindUserDto } from '../dto/find-user.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersFacade {
  constructor(private readonly usersService: UsersService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  async findOne(findUserDto: FindUserDto): Promise<UserEntity> {
    return this.usersService.findOne(findUserDto);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<UserEntity> {
    return this.usersService.updateRefreshToken(userId, refreshToken);
  }
}
