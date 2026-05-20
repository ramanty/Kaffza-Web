import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  /**
   * C-09: Re-read role from database on every request instead of trusting
   * the JWT payload. This ensures role changes (e.g. banning a merchant)
   * take effect immediately rather than waiting for JWT expiry.
   */
  async validate(payload: any) {
    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Token payload missing sub');

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, role: true, locale: true, email: true, isVerified: true },
    });

    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    if (!user.isVerified) throw new UnauthorizedException('الحساب غير مُفعّل');

    return {
      sub: user.id.toString(),
      role: user.role,
      locale: user.locale,
      email: user.email,
    };
  }
}
