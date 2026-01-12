import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Increase body size limit to 50MB for image uploads as data URLs
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  
  app.enableCors();
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
