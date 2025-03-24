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
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  PasswordValidationException,
  IncompleteFormDataException,
} from '../../users/exceptions/user-exceptions';
import { UserEntity } from '../../users/entities/user.entity';

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

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new AuthenticationFailedException(
          'El correo electrónico no está registrado',
        );
      }

      if (error instanceof AuthenticationFailedException) {
        throw error;
      }

      throw new AuthenticationFailedException('Credenciales inválidas');
    }
  }

  async register(createUserDto: CreateUserDto): Promise<Tokens> {
    try {
      const user = await this.usersService.create(createUserDto);
      return this.generateTokens(user);
    } catch (error) {
      if (
        error instanceof UserAlreadyExistsException ||
        error instanceof PasswordValidationException ||
        error instanceof IncompleteFormDataException
      ) {
        throw error;
      }

      throw new AuthenticationFailedException('Error al registrar el usuario');
    }
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const userId = payload.sub;
      const email = payload.email;

      const user = await this.usersService.findOne({ id: userId });

      if (user.email !== email) {
        throw new InvalidTokenException();
      }

      if (user.refreshToken !== refreshToken) {
        throw new InvalidTokenException();
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new InvalidTokenException();
      }

      if (error instanceof InvalidTokenException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });
    } catch (error) {
      throw new InvalidTokenException();
    }
  }

  private async generateTokens(user: UserEntity): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
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

      await this.usersService.updateRefreshToken(user.id, refreshToken);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      throw new AuthenticationFailedException('Error al generar los tokens');
    }
  }
}
