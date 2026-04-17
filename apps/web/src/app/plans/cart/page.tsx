'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { RequireAuthModal } from '../../../components/RequireAuthModal';
import { getAccessTokenFromCookies } from '../../../lib/auth';
import { PLAN_CATALOG } from '../../../lib/plan-catalog';
import { clearPlanCart, readPlanCart, removePlanFromCart } from '../../../lib/plan-cart';

export default function PlanCartPage() {
  const router = useRouter();
  const [items, setItems] = useState(readPlanCart());
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const update = () => setItems(readPlanCart());
    window.addEventListener('storage', update);
    window.addEventListener('kaffza-plan-cart-updated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('kaffza-plan-cart-updated', update);
    };
  }, []);

  const rows = useMemo(() => {
    return items
      .map((item) => {
        const plan = PLAN_CATALOG.find((p) => p.slug === item.slug);
        if (!plan) return null;
        return { ...item, plan, amount: plan.priceOmr * item.quantity };
      })
      .filter(Boolean) as Array<{
      slug: string;
      quantity: number;
      plan: (typeof PLAN_CATALOG)[number];
      amount: number;
    }>;
  }, [items]);

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  const checkout = () => {
    if (rows.length === 0) return;
    if (!getAccessTokenFromCookies()) {
      setShowAuthModal(true);
      return;
    }
    router.push(`/plans/${rows[0].plan.slug}/checkout`);
  };

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">سلة الخطط</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/plans">
          العودة للخطط
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-8 p-6 text-center">
          <p className="text-kaffza-text/80 text-sm">السلة فارغة حالياً.</p>
          <div className="mt-4">
            <Link href="/plans">
              <Button>استعرض الخطط</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {rows.map((row) => (
            <Card key={row.slug} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-kaffza-primary font-extrabold">
                    {row.plan.name} ({row.plan.subtitle})
                  </div>
                  <div className="text-kaffza-text/70 mt-1 text-xs">
                    {row.quantity} × {row.plan.priceOmr} ر.ع
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-kaffza-info font-extrabold">{row.amount} ر.ع</div>
                  <button
                    className="text-xs font-bold text-red-600 underline"
                    onClick={() => removePlanFromCart(row.slug)}
                    type="button"
                  >
                    إزالة
                  </button>
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-kaffza-primary font-extrabold">الإجمالي</span>
              <span className="text-kaffza-info text-xl font-extrabold">{total} ر.ع</span>
            </div>
            <div className="mt-4 grid gap-2">
              <Button className="w-full" onClick={checkout}>
                متابعة الدفع
              </Button>
              <Button variant="secondary" className="w-full" onClick={clearPlanCart}>
                تفريغ السلة
              </Button>
            </div>
          </Card>
        </div>
      )}

      <RequireAuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
