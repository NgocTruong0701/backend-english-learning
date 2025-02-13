import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { json, urlencoded } from 'express';
import { join } from 'path';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Essential middleware (Security)
  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().enable('trust proxy');
  }
  app.use(helmet()); // Secure HTTP headers
  app.use(compression()); // Compress response
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 3600,
  });

  // Body parser
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that don't have decorators
      forbidNonWhitelisted: true, // throw error if non-whitelisted properties are present
      transform: true, // transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // allow implicit conversion of primitive types
      },
      exceptionFactory: (errors) =>
        new UnprocessableEntityException(errors),
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Learning English System API')
    .setDescription('The Learning English System API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Get port from config
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT') || '3000');

  // Start server
  await app.listen(port);
  const url = (await app.getUrl()).replace('[::1]', 'localhost');
  logger.log(`Application is running on: ${url}`);
  logger.log(`Swagger documentation is available at: ${url}/docs`);
}

bootstrap().catch((error) => {
  new Logger('Bootstrap').error(error);
  process.exit(1);
});