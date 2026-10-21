import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');                       // all routes start with /api
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,   // silently removes fields not in the DTO
    transform: true,   // converts types, e.g. "5" to 5
  }));

  await app.listen(3000);
}
bootstrap();