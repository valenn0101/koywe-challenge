import { Controller, Get } from '@nestjs/common';
import { HelloFacade } from '../../facades/hello.facade';

@Controller('hello')
export class HelloController {
  constructor(private readonly helloFacade: HelloFacade) {}

  @Get()
  getHello(): string {
    return this.helloFacade.getHello();
  }
}
