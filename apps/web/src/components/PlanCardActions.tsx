'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { addPlanToCart } from '../lib/plan-cart';
import { Button } from './Button';

export function PlanCardActions({ slug, isEn = false }: { slug: string; isEn?: boolean }) {
  const router = useRouter();
  const planHref = isEn ? `/en/plans/${slug}` : `/plans/${slug}`;
  const cartHref = isEn ? '/en/plans/cart' : '/plans/cart';

  const addToCartAndGo = () => {
    addPlanToCart(slug, 1);
    router.push(cartHref);
  };

  return (
    <div className="mt-6 grid gap-2">
      <Link href={planHref}>
        <Button variant="secondary" className="w-full">
          {isEn ? 'Plan details' : 'تفاصيل الخطة'}
        </Button>
      </Link>
      <Button className="w-full" onClick={addToCartAndGo}>
        {isEn ? 'Add to cart' : 'إضافة للسلة'}
      </Button>
    </div>
  );
}
