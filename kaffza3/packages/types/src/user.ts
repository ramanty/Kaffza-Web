// ============================================
// User Types
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  MERCHANT = 'merchant',
  CUSTOMER = 'customer',
}

export enum Locale {
  AR = 'ar',
  EN = 'en',
}

export interface IUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  locale: Locale;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  locale?: Locale;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IOtpRequest {
  phone: string;
}

export interface IOtpVerify {
  phone: string;
  otp: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}
