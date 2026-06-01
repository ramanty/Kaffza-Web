import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomInt, randomUUID, createHash } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from './services/redis.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { MerchantRegisterDto } from './dto/merchant-register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthProviderDto } from './dto/oauth-token.dto';
import { RegisterMethodDto } from './dto/register.dto';

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_BLOCK_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly sms: SmsService,
    private readonly email: EmailService
  ) {}

  async verifyTurnstileOrThrow(token?: string, remoteIp?: string) {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) return;
    if (!token) throw new BadRequestException('يرجى إكمال تحقق لست روبوت');

    const form = new URLSearchParams({ secret, response: token });
    if (remoteIp) form.set('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!res.ok) throw new BadRequestException('فشل التحقق الأمني. حاول مرة أخرى');
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
    if (!data?.success) throw new BadRequestException('تحقق لست روبوت غير صالح');
  }

  /**
   * M-10: Password strength validation
   */
  private assertPasswordStrength(password: string) {
    if (!password || password.length < 8) {
      throw new BadRequestException('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل');
    }
  }

  async register(dto: MerchantRegisterDto) {
    const method = dto.method || (dto.email ? RegisterMethodDto.email : RegisterMethodDto.phone);
    const phone = dto.phone?.trim();
    const providedEmail = dto.email?.trim().toLowerCase();

    if (method === RegisterMethodDto.phone && !phone) {
      throw new BadRequestException('رقم الهاتف مطلوب عند التسجيل عبر الهاتف');
    }
    if (method === RegisterMethodDto.email && !providedEmail) {
      throw new BadRequestException('البريد الإلكتروني مطلوب عند التسجيل عبر البريد');
    }

    const role = 'customer';
    const locale = dto.locale || 'ar';
    const email = providedEmail || this.syntheticEmail(phone || '');
    const resolvedPhone = phone || this.syntheticPhone(email);
    const plainPassword = dto.password || this.syntheticPassword();

    const or: any[] = [{ phone: resolvedPhone }];
    if (email) or.push({ email });

    const existing = await this.prisma.user.findFirst({ where: { OR: or } });

    // Validate password strength if provided by user
    if (dto.password) {
      this.assertPasswordStrength(plainPassword);
    }

    const rateLimitKey = method === RegisterMethodDto.email ? email : resolvedPhone;
    await this.assertOtpRateLimit(rateLimitKey);

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const { otp, otpHash, otpExpiresAt } = await this.newOtp();

    if (existing) {
      await this.updateOrRejectExisting(existing.id, existing.isVerified, {
        name: dto.name,
        email,
        phone: resolvedPhone,
        passwordHash,
        role,
        locale,
        otpHash,
        otpExpiresAt,
      });
    } else {
      await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          phone: resolvedPhone,
          passwordHash,
          role,
          locale,
          isVerified: false,
          otpHash,
          otpExpiresAt,
        },
      });
    }

    if (method === RegisterMethodDto.email) {
      await this.email.sendOtp(email, otp);
    } else {
      await this.sms.sendOtp(resolvedPhone, otp);
    }

    return {
      success: true,
      message:
        method === RegisterMethodDto.email
          ? 'تم إرسال رمز التحقق (OTP) إلى البريد الإلكتروني'
          : 'تم إرسال رمز التحقق (OTP) إلى رقم الهاتف',
      data: {
        method,
        phone: method === RegisterMethodDto.phone ? resolvedPhone : undefined,
        email: method === RegisterMethodDto.email ? email : undefined,
        otpExpiresAt,
      },
    };
  }

  // OTP login: send OTP for existing users (verified or not)
  async requestOtp(dto: { phone?: string; email?: string; method?: RegisterMethodDto }) {
    const method = dto.method || (dto.email ? RegisterMethodDto.email : RegisterMethodDto.phone);
    const phone = dto.phone?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (method === RegisterMethodDto.email && !email) {
      throw new BadRequestException('البريد الإلكتروني مطلوب');
    }
    if (method === RegisterMethodDto.phone && !phone) {
      throw new BadRequestException('رقم الهاتف مطلوب');
    }

    const user =
      method === RegisterMethodDto.email
        ? await this.prisma.user.findUnique({ where: { email: email! } })
        : await this.prisma.user.findUnique({ where: { phone: phone! } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    const rateLimitKey = method === RegisterMethodDto.email ? email! : phone!;
    await this.assertOtpRateLimit(rateLimitKey);

    const { otp, otpHash, otpExpiresAt } = await this.newOtp();
    await this.prisma.user.update({ where: { id: user.id }, data: { otpHash, otpExpiresAt } });
    if (method === RegisterMethodDto.email) await this.email.sendOtp(email!, otp);
    else await this.sms.sendOtp(phone!, otp);

    return {
      success: true,
      message:
        method === RegisterMethodDto.email
          ? 'تم إرسال رمز التحقق (OTP) إلى البريد الإلكتروني'
          : 'تم إرسال رمز التحقق (OTP) إلى رقم الهاتف',
      data: {
        method,
        phone: method === RegisterMethodDto.phone ? phone : undefined,
        email: method === RegisterMethodDto.email ? email : undefined,
        otpExpiresAt,
      },
    };
  }

  async resendOtp(dto: { phone?: string; email?: string; method?: RegisterMethodDto }) {
    const method = dto.method || (dto.email ? RegisterMethodDto.email : RegisterMethodDto.phone);
    const phone = dto.phone?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (method === RegisterMethodDto.email && !email) {
      throw new BadRequestException('البريد الإلكتروني مطلوب');
    }
    if (method === RegisterMethodDto.phone && !phone) {
      throw new BadRequestException('رقم الهاتف مطلوب');
    }

    const user =
      method === RegisterMethodDto.email
        ? await this.prisma.user.findUnique({ where: { email: email! } })
        : await this.prisma.user.findUnique({ where: { phone: phone! } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');
    if (user.isVerified) throw new BadRequestException('الحساب مُفعّل بالفعل');

    const rateLimitKey = method === RegisterMethodDto.email ? email! : phone!;
    await this.assertOtpRateLimit(rateLimitKey);

    const { otp, otpHash, otpExpiresAt } = await this.newOtp();
    await this.prisma.user.update({ where: { id: user.id }, data: { otpHash, otpExpiresAt } });
    if (method === RegisterMethodDto.email) await this.email.sendOtp(email!, otp);
    else await this.sms.sendOtp(phone!, otp);

    return {
      success: true,
      message:
        method === RegisterMethodDto.email
          ? 'تمت إعادة إرسال رمز التحقق (OTP) إلى البريد الإلكتروني'
          : 'تمت إعادة إرسال رمز التحقق (OTP) إلى رقم الهاتف',
      data: {
        method,
        phone: method === RegisterMethodDto.phone ? phone : undefined,
        email: method === RegisterMethodDto.email ? email : undefined,
        otpExpiresAt,
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { method, key, user } = await this.resolveUserForOtp(dto);
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    await this.assertNotOtpBlocked(key);
    await this.assertOtp(key, user.otpHash, user.otpExpiresAt, dto.otp);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpHash: null, otpExpiresAt: null },
    });
    await this.clearOtpFailures(key);

    const tokens = await this.issueTokens(updated);
    return {
      success: true,
      message: 'تم التحقق بنجاح',
      data: { user: this.toSafeUser(updated), tokens, method },
    };
  }

  // Verify OTP for reset-password flow WITHOUT consuming OTP or issuing tokens.
  async verifyOtpForReset(dto: VerifyOtpDto) {
    const { key, user } = await this.resolveUserForOtp(dto);
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    await this.assertNotOtpBlocked(key);
    await this.assertOtp(key, user.otpHash, user.otpExpiresAt, dto.otp);
    // Do not clear otp here; it will be consumed by forgotPasswordVerify.
    await this.clearOtpFailures(key);

    return {
      success: true,
      message: 'تم التحقق من الرمز',
      data: { phone: user.phone, email: user.email, otpExpiresAt: user.otpExpiresAt },
    };
  }

  async oauthLogin(provider: OAuthProviderDto, idToken: string, fallbackName?: string) {
    const profile =
      provider === OAuthProviderDto.google
        ? await this.verifyGoogleIdToken(idToken)
        : await this.verifyAppleIdToken(idToken);

    const email = (profile.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('تعذر قراءة البريد الإلكتروني من مزود OAuth');
    if (!profile.emailVerified) {
      throw new BadRequestException('حساب OAuth غير موثّق بالبريد الإلكتروني');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    const user =
      existing ||
      (await this.prisma.user.create({
        data: {
          name: profile.name || fallbackName || 'OAuth User',
          email,
          phone: this.syntheticPhone(email),
          passwordHash: await bcrypt.hash(this.syntheticPassword(), 10),
          role: 'customer',
          locale: 'en',
          isVerified: true,
          otpHash: null,
          otpExpiresAt: null,
        },
      }));

    const tokens = await this.issueTokens(user);
    return {
      success: true,
      message: 'تم تسجيل الدخول عبر OAuth',
      data: { user: this.toSafeUser(user), tokens, provider },
    };
  }

  async login(dto: LoginDto) {
    // Allow login by email+password OR phone+password
    const email = (dto as any).email?.trim().toLowerCase();
    const phone = (dto as any).phone?.trim();

    if (!email && !phone) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({ where: { phone } });

    if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    if (!user.isVerified) throw new UnauthorizedException('الحساب غير مُفعّل. تحقق من OTP أولاً');

    const tokens = await this.issueTokens(user);
    return {
      success: true,
      message: 'تم تسجيل الدخول',
      data: { user: this.toSafeUser(user), tokens },
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken);
    const key = this.refreshKey(payload.sub, payload.jti);

    const exists = await this.redis.get(key);
    if (!exists) throw new UnauthorizedException('Refresh token غير صالح');

    // rotation
    await this.redis.del(key);

    const user = await this.prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    const tokens = await this.issueTokens(user);
    return { success: true, message: 'تم تحديث الجلسة', data: tokens };
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken);
    await this.redis.del(this.refreshKey(payload.sub, payload.jti));
    return { success: true, message: 'تم تسجيل الخروج' };
  }

  async me(sub: string) {
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(sub) } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    return { success: true, data: this.toSafeUser(user) };
  }

  async updateMe(sub: string, dto: { name?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(sub) } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;

    const updated = await this.prisma.user.update({ where: { id: BigInt(sub) }, data });
    return { success: true, message: 'تم تحديث البيانات', data: this.toSafeUser(updated) };
  }

  async changePassword(sub: string, oldPassword: string, newPassword: string) {
    this.assertPasswordStrength(newPassword);

    const user = await this.prisma.user.findUnique({ where: { id: BigInt(sub) } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('كلمة المرور القديمة غير صحيحة');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: BigInt(sub) }, data: { passwordHash } });

    // revoke all sessions
    await this.redis.delByPattern(`refresh:${user.id.toString()}:*`);

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async forgotPasswordRequest(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    await this.assertOtpRateLimit(phone);

    const { otp, otpHash, otpExpiresAt } = await this.newOtp();
    await this.prisma.user.update({ where: { id: user.id }, data: { otpHash, otpExpiresAt } });
    await this.sms.sendOtp(phone, otp);

    return {
      success: true,
      message: 'تم إرسال رمز إعادة تعيين كلمة المرور',
      data: { phone, otpExpiresAt },
    };
  }

  async forgotPasswordVerify(phone: string, otp: string, newPassword: string) {
    this.assertPasswordStrength(newPassword);
    await this.assertNotOtpBlocked(phone);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    await this.assertOtp(phone, user.otpHash, user.otpExpiresAt, otp);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, otpHash: null, otpExpiresAt: null },
    });

    // revoke all sessions
    await this.redis.delByPattern(`refresh:${user.id.toString()}:*`);
    await this.clearOtpFailures(phone);

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  }

  getRefreshCookieName() {
    return 'kaffza_refresh';
  }

  getRefreshCookieMaxAgeMs() {
    const sec = this.parseExpiryToSeconds(this.config.get<string>('jwt.refreshExpiration') || '7d');
    return sec * 1000;
  }

  // ---- OTP attempts ----
  private otpFailKey(phone: string) {
    return `otp:fail:${phone}`;
  }

  private otpBlockKey(phone: string) {
    return `otp:block:${phone}`;
  }

  private otpRateLimitKey(key: string) {
    return `otp:ratelimit:${key}`;
  }

  private async assertOtpRateLimit(key: string) {
    const rlKey = this.otpRateLimitKey(key);
    const countStr = await this.redis.get(rlKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    if (count >= 3) {
      throw new BadRequestException('تم تجاوز الحد المسموح به لطلب الرمز. يرجى المحاولة بعد 5 دقائق');
    }
    if (count === 0) {
      await this.redis.set(rlKey, '1', 300);
    } else {
      await this.redis.incr(rlKey);
    }
  }

  private async assertNotOtpBlocked(phone: string) {
    const blocked = await this.redis.get(this.otpBlockKey(phone));
    if (blocked) {
      const ttl = await this.redis.ttl(this.otpBlockKey(phone));
      const minutes = ttl > 0 ? Math.ceil(ttl / 60) : 15;
      throw new BadRequestException(`تم حظر المحاولات مؤقتاً. حاول بعد ${minutes} دقيقة`);
    }
  }

  private async recordOtpFailure(phone: string): Promise<never> {
    const key = this.otpFailKey(phone);
    const attempts = await this.redis.incr(key);
    if (attempts === 1) await this.redis.expire(key, OTP_BLOCK_SECONDS);

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await this.redis.set(this.otpBlockKey(phone), '1', OTP_BLOCK_SECONDS);
      await this.redis.del(key);
      throw new BadRequestException('تم حظر المحاولات لمدة 15 دقيقة بسبب محاولات كثيرة');
    }

    const remaining = OTP_MAX_ATTEMPTS - attempts;
    throw new BadRequestException(`رمز التحقق غير صحيح. تبقى ${remaining} محاولات`);
  }

  private async clearOtpFailures(phone: string) {
    await this.redis.del(this.otpFailKey(phone));
    await this.redis.del(this.otpBlockKey(phone));
  }

  private async assertOtp(
    phone: string,
    dbOtpHash: string | null,
    dbExpiry: Date | null,
    providedOtp: string
  ) {
    if (!dbOtpHash || !dbExpiry) await this.recordOtpFailure(phone);
    if ((dbExpiry as Date).getTime() < Date.now()) await this.recordOtpFailure(phone);
    const valid = await bcrypt.compare(providedOtp, dbOtpHash as string);
    if (!valid) await this.recordOtpFailure(phone);
  }

  // ---- tokens ----
  public async generateUserTokens(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');
    return this.issueTokens(user);
  }

  private async issueTokens(user: any) {
    const storeCount = await this.prisma.store.count({
      where: { ownerId: user.id, deletedAt: null }
    });
    const hasStore = storeCount > 0;

    const accessPayload = {
      sub: user.id.toString(),
      role: user.role,
      locale: user.locale,
      email: user.email,
      hasStore,
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiration'),
    });

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id.toString(), jti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiration'),
      }
    );

    const refreshTtlSeconds = this.parseExpiryToSeconds(
      this.config.get<string>('jwt.refreshExpiration') || '7d'
    );
    await this.redis.set(this.refreshKey(user.id.toString(), jti), '1', refreshTtlSeconds);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiryToSeconds(this.config.get<string>('jwt.expiration') || '15m'),
    };
  }

  private async verifyRefresh(token: string): Promise<{ sub: string; jti: string }> {
    try {
      return await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token غير صالح');
    }
  }

  private refreshKey(sub: string, jti: string) {
    return `refresh:${sub}:${jti}`;
  }

  private async updateOrRejectExisting(id: bigint, isVerified: boolean, data: any) {
    if (isVerified) throw new BadRequestException('المستخدم موجود بالفعل');
    return this.prisma.user.update({ where: { id }, data });
  }

  private syntheticEmail(phone: string) {
    // deterministic email for phone-only registration
    const cleaned = (phone || '').replace(/[^0-9]/g, '');
    return `${cleaned}@kaffza.local`;
  }

  private syntheticPhone(email: string) {
    const hash = createHash('sha256')
      .update(email || randomUUID())
      .digest('hex');
    const digits = hash
      .replace(/[^0-9]/g, '')
      .slice(0, 10)
      .padEnd(10, '7');
    return `+999${digits}`;
  }

  private syntheticPassword() {
    // random password used when registering via phone-only flow (OTP login)
    return `Kf${randomInt(100000, 999999)}${randomInt(100000, 999999)}`;
  }

  private async newOtp(): Promise<{ otp: string; otpHash: string; otpExpiresAt: Date }> {
    const otp = String(randomInt(0, 1000000)).padStart(6, '0');
    const otpHash = await bcrypt.hash(otp, 8);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    return { otp, otpHash, otpExpiresAt };
  }

  private toSafeUser(user: any) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      locale: user.locale,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async resolveUserForOtp(dto: VerifyOtpDto) {
    const method = dto.method || (dto.email ? RegisterMethodDto.email : RegisterMethodDto.phone);
    const phone = dto.phone?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (method === RegisterMethodDto.email) {
      if (!email) throw new BadRequestException('البريد الإلكتروني مطلوب للتحقق');
      const user = await this.prisma.user.findUnique({ where: { email } });
      return { method, key: email, user };
    }

    if (!phone) throw new BadRequestException('رقم الهاتف مطلوب للتحقق');
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return { method, key: phone, user };
  }

  private async verifyGoogleIdToken(idToken: string) {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) throw new BadRequestException('GOOGLE_OAUTH_CLIENT_ID غير مضبوط');

    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new BadRequestException('Google token غير صالح');

      return {
        email: String(payload.email || ''),
        emailVerified: String(payload.email_verified || '') === 'true',
        name: String(payload.name || ''),
      };
    } catch {
      throw new BadRequestException('التحقق من Google token فشل');
    }
  }

  private async verifyAppleIdToken(idToken: string) {
    const clientId = process.env.APPLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('APPLE_OAUTH_CLIENT_ID غير مضبوط');
    }
    const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    });
    return {
      email: String(payload.email || ''),
      emailVerified:
        payload.email_verified === true ||
        String(payload.email_verified || '').toLowerCase() === 'true',
      name: '',
    };
  }

  private parseExpiryToSeconds(input: string): number {
    const m = /^([0-9]+)([smhd])$/.exec((input || '').trim());
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    switch (m[2]) {
      case 's':
        return n;
      case 'm':
        return n * 60;
      case 'h':
        return n * 3600;
      case 'd':
        return n * 86400;
      default:
        return 0;
    }
  }
}
