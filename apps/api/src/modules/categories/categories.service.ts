import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: any, storeId: bigint, dto: CreateCategoryDto) {
    await this.assertStoreOwner(user, storeId);

    const parentId = dto.parentId ? BigInt(dto.parentId) : null;
    if (parentId) {
      const parent = await this.prisma.category.findFirst({ where: { id: parentId, storeId } });
      if (!parent) throw new BadRequestException('التصنيف الأب غير موجود ضمن هذا المتجر');
    }

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { subdomain: true } });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    const slug = await this.generateUniqueSlug(store.subdomain, dto.nameEn || dto.nameAr);

    const category = await this.prisma.category.create({
      data: {
        storeId,
        parentId,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return { success: true, message: 'تم إضافة التصنيف', data: this.map(category) };
  }

  async update(user: any, storeId: bigint, categoryId: bigint, dto: UpdateCategoryDto) {
    await this.assertStoreOwner(user, storeId);

    const category = await this.prisma.category.findFirst({ where: { id: categoryId, storeId } });
    if (!category) throw new NotFoundException('التصنيف غير موجود');

    let parentId: bigint | null | undefined = undefined;
    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        parentId = null;
      } else {
        parentId = BigInt(dto.parentId);
        if (parentId === categoryId) throw new BadRequestException('لا يمكن جعل التصنيف أبًا لنفسه');
        const parent = await this.prisma.category.findFirst({ where: { id: parentId, storeId } });
        if (!parent) throw new BadRequestException('التصنيف الأب غير موجود ضمن هذا المتجر');

        // prevent cycles: walk up from parent; if hit categoryId then cycle
        const isCycle = await this.wouldCreateCycle(storeId, parentId, categoryId);
        if (isCycle) throw new BadRequestException('لا يمكن إنشاء حلقة في شجرة التصنيفات');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        parentId,
        sortOrder: dto.sortOrder,
      },
    });

    return { success: true, message: 'تم تحديث التصنيف', data: this.map(updated) };
  }

  async remove(user: any, storeId: bigint, categoryId: bigint) {
    await this.assertStoreOwner(user, storeId);

    const category = await this.prisma.category.findFirst({ where: { id: categoryId, storeId } });
    if (!category) throw new NotFoundException('التصنيف غير موجود');

    const childrenCount = await this.prisma.category.count({ where: { parentId: categoryId, storeId } });
    if (childrenCount > 0) throw new BadRequestException('لا يمكن حذف تصنيف لديه تصنيفات فرعية');

    const productsCount = await this.prisma.product.count({ where: { categoryId, storeId } });
    if (productsCount > 0) throw new BadRequestException('لا يمكن حذف تصنيف مرتبط بمنتجات');

    await this.prisma.category.delete({ where: { id: categoryId } });

    return { success: true, message: 'تم حذف التصنيف' };
  }

  async list(storeId: bigint) {
    const items = await this.prisma.category.findMany({
      where: { storeId },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    return { success: true, data: items.map((c) => this.map(c)) };
  }

  async tree(storeId: bigint) {
    const items = await this.prisma.category.findMany({
      where: { storeId },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });

    const byId = new Map<string, any>();
    items.forEach((c) => {
      byId.set(c.id.toString(), { ...this.map(c), children: [] });
    });

    const roots: any[] = [];
    items.forEach((c) => {
      const node = byId.get(c.id.toString());
      if (c.parentId) {
        const parent = byId.get(c.parentId.toString());
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });

    return { success: true, data: roots };
  }

  // ---------- Helpers ----------

  private async assertStoreOwner(user: any, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    if (user.role !== 'merchant') throw new ForbiddenException('فقط التاجر يمكنه إدارة التصنيفات');

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    if (store.ownerId !== BigInt(user.sub)) {
      throw new ForbiddenException('ليس لديك صلاحية على هذا المتجر');
    }
  }

  private slugify(input: string) {
    return (input || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(storeSubdomain: string, base: string) {
    const baseSlug = this.slugify(base) || 'category';
    let slug = `${storeSubdomain}-${baseSlug}`;
    let i = 0;
    while (true) {
      const exists = await this.prisma.category.findUnique({ where: { slug } });
      if (!exists) return slug;
      i += 1;
      slug = `${storeSubdomain}-${baseSlug}-${i}`;
    }
  }

  private async wouldCreateCycle(storeId: bigint, startParentId: bigint, targetId: bigint) {
    let current: bigint | null = startParentId;
    while (current) {
      if (current === targetId) return true;
      const cat = await this.prisma.category.findFirst({ where: { id: current, storeId }, select: { parentId: true } });
      current = cat?.parentId ?? null;
    }
    return false;
  }

  private map(c: any) {
    return {
      id: c.id.toString(),
      storeId: c.storeId.toString(),
      parentId: c.parentId ? c.parentId.toString() : null,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      slug: c.slug,
      sortOrder: c.sortOrder,
    };
  }
}
