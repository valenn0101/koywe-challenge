import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProd = configService.get('NODE_ENV') === 'production';

  const corsOrigins =
    configService.get('CORS_ORIGINS') ||
    'http://localhost:3000,http://localhost:4200,http://localhost:8080';

  app.enableCors({
    origin: isProd
      ? corsOrigins.split(',').map((origin) => origin.trim())
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: 3600,
  });

  const config = new DocumentBuilder()
    .setTitle('API Example')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('api')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => {
          return {
            property: err.property,
            constraints: Object.values(err.constraints || {}),
          };
        });

        return {
          name: 'ValidationError',
          message: 'Error de validación',
          response: {
            message: messages,
          },
        };
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
