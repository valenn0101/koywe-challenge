import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { Tokens, JwtPayload } from '../interfaces/tokens.interface';
import { CreateUserDto } from '../../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.usersService.findOne({ email });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user.id, user.email);
  }

  async register(createUserDto: CreateUserDto): Promise<Tokens> {
    const user = await this.usersService.create(createUserDto);
    return this.generateTokens(user.id, user.email);
  }

  async refreshTokens(userId: number, email: string): Promise<Tokens> {
    const user = await this.usersService.findOne({ id: userId });

    if (user.email !== email) {
      throw new UnauthorizedException('Acceso denegado');
    }

    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: '20m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
