import { Module } from '@nestjs/common';
import { HelloController } from './hello.controller';
import { HelloService } from './services/hello.service';
import { HelloFacade } from '../../facades/hello.facade';

@Module({
  controllers: [HelloController],
  providers: [HelloService, HelloFacade],
})
export class HelloModule {}
