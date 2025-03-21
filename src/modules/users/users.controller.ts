import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiFindAllUsers,
  ApiFindUserById,
  ApiFindUserByEmail,
} from './swagger/user.decorator';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiFindAllUsers()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  @Get(':id')
  @ApiFindUserById()
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findOne({ id: parseInt(id) });
    const { password, ...result } = user;
    return result;
  }

  @Get('email/:email')
  @ApiFindUserByEmail()
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findOne({ email });
    const { password, ...result } = user;
    return result;
  }
}
