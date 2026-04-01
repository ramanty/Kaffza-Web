import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private isMobile(req: Request) {
    const hdr = (req.headers['x-client'] || req.headers['x-platform'] || '').toString().toLowerCase();
    return hdr.includes('mobile') || hdr.includes('expo') || hdr.includes('react-native');
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(this.auth.getRefreshCookieName(), refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: this.auth.getRefreshCookieMaxAgeMs(),
      path: '/api/v1/auth',
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(this.auth.getRefreshCookieName(), { path: '/api/v1/auth' });
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }


@Post('otp/request')
@Throttle({ default: { limit: 3, ttl: 60000 } })
otpRequest(@Body() dto: OtpRequestDto) {
  return this.auth.requestOtp(dto.phone);
}

  @Post('otp/resend')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resendOtp(@Body() dto: OtpRequestDto) {
    return this.auth.resendOtp(dto.phone);
  }





@Post('otp/verify')
@Throttle({ default: { limit: 10, ttl: 60000 } })
async otpVerify(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
  // If purpose is reset-password, only verify OTP (do not issue tokens / do not consume OTP)
  const purpose = (req.headers['x-purpose'] || '').toString().toLowerCase();
  if (purpose === 'reset' || purpose === 'forgot-password') {
    return this.auth.verifyOtpForReset(dto);
  }

  // Default: OTP login / account verification (issues tokens and consumes OTP)
  const result = await this.auth.verifyOtp(dto);
  const tokens = result.data.tokens;

  if (this.isMobile(req)) return result;

  this.setRefreshCookie(res, tokens.refreshToken);
  return { ...result, data: { user: result.data.user, tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } } };
}


  @Post('verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.verifyOtp(dto);
    const tokens = result.data.tokens;

    if (this.isMobile(req)) return result;

    this.setRefreshCookie(res, tokens.refreshToken);
    return { ...result, data: { user: result.data.user, tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } } };
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    const tokens = result.data.tokens;

    if (this.isMobile(req)) return result;

    this.setRefreshCookie(res, tokens.refreshToken);
    return { ...result, data: { user: result.data.user, tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } } };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = (req as any).cookies?.[this.auth.getRefreshCookieName()];
    const token = this.isMobile(req) ? dto.refreshToken : dto.refreshToken || cookieToken;

    if (!token) return { success: false, message: 'Refresh token مطلوب' };

    const result = await this.auth.refresh(token);
    const tokens = result.data;

    if (this.isMobile(req)) return result;

    this.setRefreshCookie(res, tokens.refreshToken);
    return { ...result, data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } };
  }

  @Post('logout')
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = (req as any).cookies?.[this.auth.getRefreshCookieName()];
    const token = this.isMobile(req) ? dto.refreshToken : dto.refreshToken || cookieToken;

    if (!token) {
      this.clearRefreshCookie(res);
      return { success: true, message: 'تم تسجيل الخروج' };
    }

    const result = await this.auth.logout(token);
    this.clearRefreshCookie(res);
    return result;
  }

  @Post('forgot-password/request')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPasswordRequest(@Body() dto: OtpRequestDto) {
    return this.auth.forgotPasswordRequest(dto.phone);
  }

  @Post('forgot-password/verify')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPasswordVerify(@Body() dto: ForgotPasswordVerifyDto) {
    return this.auth.forgotPasswordVerify(dto.phone, dto.otp, dto.newPassword);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: any) {
    return this.auth.me(user.sub);
  }

@Patch('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
updateMe(@CurrentUser() user: any, @Body() dto: UpdateMeDto) {
  return this.auth.updateMe(user.sub, dto);
}

@Post('change-password')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto, @Res({ passthrough: true }) res: Response) {
  // revoke refresh cookie after password change
  this.clearRefreshCookie(res);
  return this.auth.changePassword(user.sub, dto.oldPassword, dto.newPassword);
}

}
