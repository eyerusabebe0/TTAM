import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // All routes start with /api

  // ✅ Enables CORS for your Netlify frontend & local dev environment
  app.enableCors({
    origin: [
      'https://ask-tour.netlify.app', 
      'http://localhost:5173',        
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Silently removes fields not defined in the DTO
      transform: true, // Converts types, e.g., string "5" to number 5
    }),
  );

  // ✅ Dynamic port for Render + fallback to 3000 for local dev
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();