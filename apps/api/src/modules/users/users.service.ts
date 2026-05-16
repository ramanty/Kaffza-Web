import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    if (filters?.role) where.role = filters.role as UserRole;
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async update(id: bigint, dto: UpdateUserDto) {
    await this.findById(id);

    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('البريد الإلكتروني مستخدم بالفعل');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
      },
    });
    return this.toSafeUser(updated);
  }

  async remove(id: bigint) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
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
