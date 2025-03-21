import { Injectable } from '@nestjs/common';
import { UsersService } from '../modules/users/services/users.service';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { UserEntity } from '../modules/users/entities/user.entity';

@Injectable()
export class UsersFacade {
  constructor(private readonly usersService: UsersService) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }
}
