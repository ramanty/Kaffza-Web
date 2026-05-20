import {
  BadRequestException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { RegisterMethodDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {}

  async findById(id: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findAll(filters?: { role?: string }) {
    const where: Prisma.UserWhereInput = {};
    if (filters?.role) where.role = filters.role as Prisma.EnumUserRoleFilter;
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async update(id: bigint, dto: UpdateUserDto) {
    const existingUser = await this.findById(id);

    let isEmailChanged = false;
    if (dto.email !== undefined && existingUser.email !== dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('البريد الإلكتروني مستخدم بالفعل');
      }
      isEmailChanged = true;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
        ...(isEmailChanged && { isVerified: false }),
      },
    });

    if (isEmailChanged && dto.email) {
      await this.authService
        .resendOtp({ email: dto.email, method: RegisterMethodDto.email })
        .catch((e) => {
          console.error('Failed to send OTP on email change:', e);
        });
    }

    return this.toSafeUser(updated);
  }

  async remove(id: bigint) {
    await this.findById(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true, message: 'تم حذف المستخدم' };
  }

  toSafeUser(user: User) {
    return {
      id: Number(user.id),
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
}
