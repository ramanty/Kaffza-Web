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
import { SanitizePipe } from './common/pipes/sanitize.pipe';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS — Allow web and mobile clients
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : []),
    // Only allow localhost in non-production environments (H-03)
    ...(isProduction ? [] : ['http://localhost:3000', 'http://localhost:3001']),
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Only allow specific known subdomains, not arbitrary ones (C-06)
      if (/^https:\/\/(www|app|api|store)\.kaffza\.(om|me)$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('CORS blocked'));
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new SanitizePipe(), // C-07: Sanitize inputs before validation
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger API Documentation — hidden in production (C-05)
  if (!isProduction) {
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
  }

  const port = process.env.API_PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Kaffza API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
