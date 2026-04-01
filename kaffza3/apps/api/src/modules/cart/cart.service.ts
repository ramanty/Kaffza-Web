import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CartRedisService } from './cart.redis.service';

export interface CartLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService, private readonly redis: CartRedisService) {}

  private cartKey(userId: string, storeId: string) {
    return `cart:${userId}:${storeId}`;
  }

  async getCart(user: any, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    const key = this.cartKey(user.sub, storeId.toString());
    const raw = await this.redis.get(key);
    const lines: CartLine[] = raw ? JSON.parse(raw) : [];
    return this.compute(storeId, lines);
  }

  async addItem(user: any, storeId: bigint, line: CartLine) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const key = this.cartKey(user.sub, storeId.toString());
    const raw = await this.redis.get(key);
    const lines: CartLine[] = raw ? JSON.parse(raw) : [];

    const idx = lines.findIndex((l) => l.productId === line.productId && (l.variantId || null) === (line.variantId || null));
    if (idx >= 0) lines[idx].quantity += line.quantity;
    else lines.push({ ...line });

    await this.validateLines(storeId, lines);

    await this.redis.set(key, JSON.stringify(lines), 60 * 60 * 24 * 7);
    return this.compute(storeId, lines);
  }

  async updateQuantity(user: any, storeId: bigint, line: CartLine) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const key = this.cartKey(user.sub, storeId.toString());
    const raw = await this.redis.get(key);
    const lines: CartLine[] = raw ? JSON.parse(raw) : [];

    const idx = lines.findIndex((l) => l.productId === line.productId && (l.variantId || null) === (line.variantId || null));
    if (idx < 0) throw new NotFoundException('العنصر غير موجود في السلة');

    lines[idx].quantity = line.quantity;

    await this.validateLines(storeId, lines);

    await this.redis.set(key, JSON.stringify(lines), 60 * 60 * 24 * 7);
    return this.compute(storeId, lines);
  }

  async removeItem(user: any, storeId: bigint, productId: string, variantId?: string) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const key = this.cartKey(user.sub, storeId.toString());
    const raw = await this.redis.get(key);
    const lines: CartLine[] = raw ? JSON.parse(raw) : [];

    const filtered = lines.filter((l) => !(l.productId === productId && (l.variantId || null) === (variantId || null)));
    await this.redis.set(key, JSON.stringify(filtered), 60 * 60 * 24 * 7);
    return this.compute(storeId, filtered);
  }

  async clearCart(userId: string, storeId: string) {
    await this.redis.del(this.cartKey(userId, storeId));
  }

  private async validateLines(storeId: bigint, lines: CartLine[]) {
    for (const l of lines) {
      const productId = BigInt(l.productId);
      const product = await this.prisma.product.findFirst({ where: { id: productId, storeId } });
      if (!product) throw new BadRequestException('منتج غير موجود ضمن هذا المتجر');
      if (!product.isActive) throw new BadRequestException('منتج غير متاح');

      if (l.variantId) {
        const variant = await this.prisma.productVariant.findFirst({ where: { id: BigInt(l.variantId), productId } });
        if (!variant) throw new BadRequestException('النوع (Variant) غير موجود');
        if (variant.stock < l.quantity) throw new BadRequestException('الكمية المطلوبة غير متوفرة للنوع');
      } else {
        if (product.stock < l.quantity) throw new BadRequestException('الكمية المطلوبة غير متوفرة للمنتج');
      }
    }
  }

  private async compute(storeId: bigint, lines: CartLine[]) {
    const detailed: any[] = [];
    let subtotal = 0;
    let weightKg = 0;

    for (const l of lines) {
      const productId = BigInt(l.productId);
      const product = await this.prisma.product.findFirst({ where: { id: productId, storeId }, include: { variants: true } });
      if (!product) continue;

      let unitPrice: any = product.price;
      let variant: any = null;

      if (l.variantId) {
        variant = product.variants.find((v: any) => v.id.toString() === l.variantId);
        if (variant) unitPrice = variant.price;
      }

      const lineTotal = Number(unitPrice) * l.quantity;
      subtotal += lineTotal;
      weightKg += Number(product.weightKg || 0) * l.quantity;

      detailed.push({
        productId: l.productId,
        variantId: l.variantId || null,
        quantity: l.quantity,
        product: { id: product.id.toString(), nameAr: product.nameAr, nameEn: product.nameEn, images: product.images },
        variant: variant ? { id: variant.id.toString(), nameAr: variant.nameAr, nameEn: variant.nameEn } : null,
        unitPrice,
        lineTotal,
      });
    }

    const shippingCost = this.estimateShipping(weightKg);
    const total = subtotal + shippingCost;

    return { success: true, data: { storeId: storeId.toString(), items: detailed, subtotal, shippingCost, total, weightKg, currency: 'OMR' } };
  }

  private estimateShipping(weightKg: number) {
    const base = Number(process.env.SHIPPING_BASE_COST || 0);
    const perKg = Number(process.env.SHIPPING_PER_KG || 0);
    const cost = base + perKg * Math.max(0, weightKg);
    return Math.round(cost * 1000) / 1000;
  }
}
