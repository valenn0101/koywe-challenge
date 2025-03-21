import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { UsersFacade } from '../../facades/users.facade';
import { UsersRepository } from './repositories/users.repository';
import { PrismaService } from '../../database/prisma.service';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersFacade,
    UsersRepository,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
