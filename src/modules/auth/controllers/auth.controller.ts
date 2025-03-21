import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Tokens } from '../interfaces/tokens.interface';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto): Promise<Tokens> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<Tokens> {
    return this.authService.login(email, password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body('userId') userId: number,
    @Body('email') email: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, email);
  }
}
