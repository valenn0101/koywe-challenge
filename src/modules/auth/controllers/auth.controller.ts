import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Tokens } from '../interfaces/tokens.interface';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';
import { LoginSwagger, RegisterSwagger, RefreshSwagger } from '../swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(RegisterSwagger.operation)
  @ApiResponse(RegisterSwagger.responses[HttpStatus.CREATED])
  @ApiResponse(RegisterSwagger.responses[HttpStatus.BAD_REQUEST])
  @ApiResponse(RegisterSwagger.responses[HttpStatus.CONFLICT])
  async register(@Body() createUserDto: CreateUserDto): Promise<Tokens> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(LoginSwagger.operation)
  @ApiResponse(LoginSwagger.responses[HttpStatus.OK])
  @ApiResponse(LoginSwagger.responses[HttpStatus.UNAUTHORIZED])
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(RefreshSwagger.operation)
  @ApiResponse(RefreshSwagger.responses[HttpStatus.OK])
  @ApiResponse(RefreshSwagger.responses[HttpStatus.UNAUTHORIZED])
  async refreshTokens(
    @Body('userId') userId: number,
    @Body('email') email: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, email);
  }
}
