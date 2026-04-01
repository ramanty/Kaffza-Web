// ============================================
// Kaffza (قفزة) — API Entry Point
// جوهرة الشهباء الحديثة ش.م.م
// ============================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS — Allow web and mobile clients
  app.enableCors({
    origin: [
      process.env.APP_URL || 'http://localhost:3000',
      /\.kaffza\.om$/,
    ],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Kaffza API — قفزة')
    .setDescription('API documentation for Kaffza e-commerce platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & OTP')
    .addTag('Stores', 'Store management')
    .addTag('Products', 'Product catalog')
    .addTag('Orders', 'Order management')
    .addTag('Payments', 'Payment & Escrow')
    .addTag('Shipping', 'Shipping & Tracking')
    .addTag('Wallets', 'Wallet & Withdrawals')
    .addTag('Disputes', 'Dispute resolution')
    .addTag('Admin', 'Platform administration')
    .addTag('Notifications', 'Notifications')
    .addTag('Escrow', 'Escrow release jobs')
    .addTag('Cart', 'Shopping cart')
    .addTag('Categories', 'Category management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Kaffza API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
