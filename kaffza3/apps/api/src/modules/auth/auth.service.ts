import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from './services/redis.service';
import { SmsService } from './services/sms.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

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
  ) {}


async register(dto: RegisterDto) {
  // Support phone-only customer registration for web.
  const role = (dto as any).role || 'customer';
  const locale = (dto as any).locale || 'ar';
  const email = (dto as any).email || this.syntheticEmail(dto.phone);
  const plainPassword = (dto as any).password || this.syntheticPassword();

  const or: any[] = [{ phone: dto.phone }];
  if (email) or.push({ email });

  const existing = await this.prisma.user.findFirst({ where: { OR: or } });

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const { otp, otpExpiresAt } = this.newOtp();

  const user = existing
    ? await this.updateOrRejectExisting(existing.id, existing.isVerified, {
        name: dto.name,
        email,
        phone: dto.phone,
        passwordHash,
        role,
        locale,
        otp,
        otpExpiresAt,
      })
    : await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          phone: dto.phone,
          passwordHash,
          role,
          locale,
          isVerified: false,
          otp,
          otpExpiresAt,
        },
      });

  await this.sms.sendOtp(user.phone, otp);
  return { success: true, message: 'تم إرسال رمز التحقق (OTP) إلى رقم الهاتف', data: { phone: user.phone, otpExpiresAt } };
}

// OTP login: send OTP for existing users (verified or not)
async requestOtp(phone: string) {
  const user = await this.prisma.user.findUnique({ where: { phone } });
  if (!user) throw new BadRequestException('المستخدم غير موجود');

  const { otp, otpExpiresAt } = this.newOtp();
  await this.prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt } });
  await this.sms.sendOtp(phone, otp);

  return { success: true, message: 'تم إرسال رمز التحقق (OTP)', data: { phone, otpExpiresAt } };
}
  async resendOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');
    if (user.isVerified) throw new BadRequestException('الحساب مُفعّل بالفعل');

    const { otp, otpExpiresAt } = this.newOtp();
    await this.prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt } });
    await this.sms.sendOtp(phone, otp);

    return { success: true, message: 'تم إعادة إرسال رمز التحقق (OTP)', data: { phone, otpExpiresAt } };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    await this.assertNotOtpBlocked(dto.phone);

    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    await this.assertOtp(dto.phone, user.otp, user.otpExpiresAt, dto.otp);

    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true, otp: null, otpExpiresAt: null } });
    await this.clearOtpFailures(dto.phone);

    const tokens = await this.issueTokens(updated);
    return { success: true, message: 'تم التحقق بنجاح', data: { user: this.toSafeUser(updated), tokens } };
  }

// Verify OTP for reset-password flow WITHOUT consuming OTP or issuing tokens.
async verifyOtpForReset(dto: VerifyOtpDto) {
  await this.assertNotOtpBlocked(dto.phone);

  const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
  if (!user) throw new BadRequestException('المستخدم غير موجود');

  await this.assertOtp(dto.phone, user.otp, user.otpExpiresAt, dto.otp);
  // Do not clear otp here; it will be consumed by forgotPasswordVerify.
  await this.clearOtpFailures(dto.phone);

  return { success: true, message: 'تم التحقق من الرمز', data: { phone: dto.phone, otpExpiresAt: user.otpExpiresAt } };
}



async login(dto: LoginDto) {
  // Allow login by email+password OR phone+password
  const email = (dto as any).email;
  const phone = (dto as any).phone;

  if (!email && !phone) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

  const user = email
    ? await this.prisma.user.findUnique({ where: { email } })
    : await this.prisma.user.findUnique({ where: { phone } });

  if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

  const ok = await bcrypt.compare(dto.password, user.passwordHash);
  if (!ok) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

  if (!user.isVerified) throw new UnauthorizedException('الحساب غير مُفعّل. تحقق من OTP أولاً');

  const tokens = await this.issueTokens(user);
  return { success: true, message: 'تم تسجيل الدخول', data: { user: this.toSafeUser(user), tokens } };
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

    const { otp, otpExpiresAt } = this.newOtp();
    await this.prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt } });
    await this.sms.sendOtp(phone, otp);

    return { success: true, message: 'تم إرسال رمز إعادة تعيين كلمة المرور', data: { phone, otpExpiresAt } };
  }

  async forgotPasswordVerify(phone: string, otp: string, newPassword: string) {
    await this.assertNotOtpBlocked(phone);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');

    await this.assertOtp(phone, user.otp, user.otpExpiresAt, otp);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, otp: null, otpExpiresAt: null } });

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

  private async assertOtp(phone: string, dbOtp: string | null, dbExpiry: Date | null, providedOtp: string) {
    if (!dbOtp || !dbExpiry) await this.recordOtpFailure(phone);
    if (dbExpiry.getTime() < Date.now()) await this.recordOtpFailure(phone);
    if (dbOtp !== providedOtp) await this.recordOtpFailure(phone);
  }

  // ---- tokens ----
  private async issueTokens(user: any) {
    const accessPayload = { sub: user.id.toString(), role: user.role, locale: user.locale, email: user.email };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiration'),
    });

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id.toString(), jti },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: this.config.get<string>('jwt.refreshExpiration') },
    );

    const refreshTtlSeconds = this.parseExpiryToSeconds(this.config.get<string>('jwt.refreshExpiration') || '7d');
    await this.redis.set(this.refreshKey(user.id.toString(), jti), '1', refreshTtlSeconds);

    return { accessToken, refreshToken, expiresIn: this.parseExpiryToSeconds(this.config.get<string>('jwt.expiration') || '15m') };
  }

  private async verifyRefresh(token: string): Promise<{ sub: string; jti: string }> {
    try {
      return await this.jwt.verifyAsync(token, { secret: this.config.get<string>('jwt.refreshSecret') });
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

private syntheticPassword() {
  // random password used when registering via phone-only flow (OTP login)
  return `Kf${randomInt(100000, 999999)}${randomInt(100000, 999999)}`;
}

  private newOtp(): { otp: string; otpExpiresAt: Date } {
    const otp = String(randomInt(0, 1000000)).padStart(6, '0');
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    return { otp, otpExpiresAt };
  }

  private toSafeUser(user: any) {
    return { id: Number(user.id), name: user.name, email: user.email, phone: user.phone, role: user.role, locale: user.locale, isVerified: user.isVerified, createdAt: user.createdAt, updatedAt: user.updatedAt };
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
