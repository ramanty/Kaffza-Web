// ============================================
// Kaffza (قفزة) — Environment Configuration
// ============================================

import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'Kaffza',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  port: parseInt(process.env.API_PORT || '4000', 10),
  env: process.env.NODE_ENV || 'development',
  currency: 'OMR',
  currencySymbol: 'ر.ع',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  name: process.env.DATABASE_NAME || 'kaffza_db',
  user: process.env.DATABASE_USER || 'kaffza_user',
  password: process.env.DATABASE_PASSWORD,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'kaffza-dev-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'kaffza-refresh-secret',
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export const thawaniConfig = registerAs('thawani', () => ({
  baseUrl:
    process.env.THAWANI_BASE_URL ||
    process.env.THAWANI_API_URL ||
    'https://uatcheckout.thawani.om/api/v1',
  redirectBase: process.env.THAWANI_REDIRECT_BASE || 'https://uatcheckout.thawani.om/pay/',
  apiUrl:
    process.env.THAWANI_API_URL ||
    process.env.THAWANI_BASE_URL ||
    'https://uatcheckout.thawani.om/api/v1',
  apiKey: process.env.THAWANI_API_KEY || 'test_secret_key',
  publishableKey:
    process.env.THAWANI_PUBLISHABLE_KEY || process.env.THAWANI_API_KEY || 'test_publishable_key',
  secretKey: process.env.THAWANI_SECRET_KEY || process.env.THAWANI_API_KEY || 'test_secret_key',
  successUrl: process.env.THAWANI_SUCCESS_URL || 'http://localhost:3000/pay/success',
  cancelUrl: process.env.THAWANI_CANCEL_URL || 'http://localhost:3000/pay/cancel',
  successUrlMobile:
    process.env.THAWANI_SUCCESS_URL_MOBILE ||
    process.env.THAWANI_SUCCESS_URL ||
    'http://localhost:3000/pay/success',
  cancelUrlMobile:
    process.env.THAWANI_CANCEL_URL_MOBILE ||
    process.env.THAWANI_CANCEL_URL ||
    'http://localhost:3000/pay/cancel',
  webhookSecret: process.env.THAWANI_WEBHOOK_SECRET || 'test_webhook_secret',
}));

export const escrowConfig = registerAs('escrow', () => ({
  newMerchantDays: parseInt(process.env.ESCROW_NEW_MERCHANT_DAYS || '14', 10),
  standardDays: parseInt(process.env.ESCROW_STANDARD_DAYS || '7', 10),
  trustedDays: parseInt(process.env.ESCROW_TRUSTED_DAYS || '3', 10),
  newMerchantOrderThreshold: parseInt(process.env.ESCROW_NEW_MERCHANT_ORDER_THRESHOLD || '3', 10),
  trustedOrderThreshold: parseInt(process.env.ESCROW_TRUSTED_ORDER_THRESHOLD || '50', 10),
  trustedRatingThreshold: parseFloat(process.env.ESCROW_TRUSTED_RATING_THRESHOLD || '4.5'),
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}));
