import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQuery } from './dto/list-products.query';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: any, storeId: bigint, dto: CreateProductDto) {
    await this.assertStoreOwner(user, storeId);

    const categoryId = dto.categoryId ? BigInt(dto.categoryId) : undefined;

    if (categoryId) {
      const cat = await this.prisma.category.findFirst({ where: { id: categoryId, storeId } });
      if (!cat) throw new BadRequestException('التصنيف غير موجود ضمن هذا المتجر');
    }

    const product = await this.prisma.product.create({
      data: {
        storeId,
        categoryId,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        price: dto.price as any,
        compareAtPrice: dto.compareAtPrice as any,
        stock: dto.stock,
        images: dto.images ?? [],
        sku: dto.sku,
        weightKg: dto.weightKg as any,
        isActive: dto.isActive ?? true,
        variants: dto.variants?.length
          ? {
              create: dto.variants.map((v) => ({
                nameAr: v.nameAr,
                nameEn: v.nameEn,
                price: v.price as any,
                stock: v.stock,
                sku: v.sku,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });

    return { success: true, message: 'تم إضافة المنتج', data: this.map(product) };
  }

  async update(user: any, storeId: bigint, productId: bigint, dto: UpdateProductDto) {
    await this.assertStoreOwner(user, storeId);

    const product = await this.prisma.product.findFirst({ where: { id: productId, storeId }, include: { variants: true } });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    const categoryId = dto.categoryId !== undefined ? (dto.categoryId ? BigInt(dto.categoryId) : null) : undefined;
    if (categoryId && categoryId !== null) {
      const cat = await this.prisma.category.findFirst({ where: { id: categoryId, storeId } });
      if (!cat) throw new BadRequestException('التصنيف غير موجود ضمن هذا المتجر');
    }

    // Variants upsert strategy
    if (dto.variants) {
      const keepIds = dto.variants.filter((v) => v.id).map((v) => BigInt(v.id!));
      await this.prisma.productVariant.deleteMany({
        where: { productId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
      });

      for (const v of dto.variants) {
        if (v.id) {
          const vid = BigInt(v.id);
          const exists = product.variants.find((x) => x.id === vid);
          if (!exists) throw new BadRequestException('Variant غير تابع لهذا المنتج');
          await this.prisma.productVariant.update({
            where: { id: vid },
            data: { nameAr: v.nameAr, nameEn: v.nameEn, price: v.price as any, stock: v.stock, sku: v.sku },
          });
        } else {
          await this.prisma.productVariant.create({
            data: { productId, nameAr: v.nameAr, nameEn: v.nameEn, price: v.price as any, stock: v.stock, sku: v.sku },
          });
        }
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        categoryId,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        price: dto.price as any,
        compareAtPrice: dto.compareAtPrice as any,
        stock: dto.stock,
        images: dto.images,
        sku: dto.sku,
        weightKg: dto.weightKg as any,
        isActive: dto.isActive,
      },
      include: { variants: true },
    });

    return { success: true, message: 'تم تحديث المنتج', data: this.map(updated) };
  }

  // Soft delete
  async remove(user: any, storeId: bigint, productId: bigint) {
    await this.assertStoreOwner(user, storeId);

    const product = await this.prisma.product.findFirst({ where: { id: productId, storeId } });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    await this.prisma.product.update({ where: { id: productId }, data: { isActive: false } });

    return { success: true, message: 'تم حذف المنتج (تعطيل)' };
  }

  async getOne(storeId: bigint, productId: bigint) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, storeId }, include: { variants: true } });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    return { success: true, data: this.map(product) };
  }

  async list(storeId: bigint, query: ListProductsQuery) {
    const where: any = { storeId, ...(query.includeInactive ? {} : { isActive: true }) };

    if (query.categoryId) where.categoryId = BigInt(query.categoryId);
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) };
    }

    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search, mode: 'insensitive' } },
        { nameEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({ where, include: { variants: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);

    return { success: true, data: items.map((p) => this.map(p)), meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
  }

  private async assertStoreOwner(user: any, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    if (user.role !== 'merchant') throw new ForbiddenException('فقط التاجر يمكنه إدارة المنتجات');

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    if (store.ownerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية على هذا المتجر');
  }

  private map(p: any) {
    return {
      id: p.id.toString(),
      storeId: p.storeId.toString(),
      categoryId: p.categoryId ? p.categoryId.toString() : null,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      images: p.images,
      sku: p.sku,
      weightKg: p.weightKg,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      variants: p.variants?.map((v: any) => ({
        id: v.id.toString(),
        productId: v.productId.toString(),
        nameAr: v.nameAr,
        nameEn: v.nameEn,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
      })),
    };
  }
}
