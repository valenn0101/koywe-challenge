import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { Tokens, JwtPayload } from '../interfaces/tokens.interface';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticationFailedException,
  InvalidTokenException,
  UnauthorizedException,
} from '../exceptions/auth-exceptions';
import { UserAlreadyExistsException } from '../../users/exceptions/user-exceptions';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<Tokens> {
    try {
      const user = await this.usersService.findOne({ email });

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new AuthenticationFailedException('Contraseña incorrecta');
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof AuthenticationFailedException) {
        throw error;
      }
      throw new AuthenticationFailedException('Credenciales inválidas');
    }
  }

  async register(createUserDto: CreateUserDto): Promise<Tokens> {
    try {
      const user = await this.usersService.create(createUserDto);
      return this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw error;
      }
      throw new AuthenticationFailedException('Error al registrar el usuario');
    }
  }

  async refreshTokens(userId: number, email: string): Promise<Tokens> {
    try {
      const user = await this.usersService.findOne({ id: userId });

      if (user.email !== email) {
        throw new InvalidTokenException();
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }

  private async generateTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(jwtPayload, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
          expiresIn: '20m',
        }),
        this.jwtService.signAsync(jwtPayload, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
          expiresIn: '7d',
        }),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new AuthenticationFailedException('Error al generar los tokens');
    }
  }
}
