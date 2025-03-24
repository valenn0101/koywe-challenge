import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersFacade } from './services/users.facade';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiFindAllUsers,
  ApiFindUserById,
  ApiFindUserByEmail,
} from './swagger/user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersFacade: UsersFacade) {}

  @Get()
  @ApiFindAllUsers()
  async findAll() {
    const users = await this.usersFacade.findAll();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  @Get(':id')
  @ApiFindUserById()
  async findById(@Param('id') id: string) {
    const user = await this.usersFacade.findOne({ id: parseInt(id) });
    const { password, ...result } = user;
    return result;
  }

  @Get('email/:email')
  @ApiFindUserByEmail()
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersFacade.findOne({ email });
    const { password, ...result } = user;
    return result;
  }
}
