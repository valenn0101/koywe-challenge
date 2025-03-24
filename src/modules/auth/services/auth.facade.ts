import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { Tokens } from '../interfaces/tokens.interface';

@Injectable()
export class AuthFacade {
  constructor(private readonly authService: AuthService) {}

  async login(email: string, password: string): Promise<Tokens> {
    return this.authService.login(email, password);
  }

  async register(createUserDto: CreateUserDto): Promise<Tokens> {
    return this.authService.register(createUserDto);
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    return this.authService.refreshTokens(refreshToken);
  }
}
