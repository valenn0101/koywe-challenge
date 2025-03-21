import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user;
    return result;
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findOne({ id: parseInt(id) });
    const { password, ...result } = user;
    return result;
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findOne({ email });
    const { password, ...result } = user;
    return result;
  }
}
