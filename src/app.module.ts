import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuotesModule } from './modules/quotes/quotes.module';

@Module({
  imports: [UsersModule, AuthModule, QuotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
