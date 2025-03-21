import { Injectable } from '@nestjs/common';
import { HelloService } from '../modules/hello/services/hello.service';

@Injectable()
export class HelloFacade {
  constructor(private readonly helloService: HelloService) {}

  getHello(): string {
    return this.helloService.getHello();
  }
}
