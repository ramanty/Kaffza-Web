'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { RequireAuthModal } from '../../../../components/RequireAuthModal';
import { getAccessTokenFromCookies } from '../../../../lib/auth';
import { PLAN_CATALOG, getPlanSubtitle } from '../../../../lib/plan-catalog';
import { clearPlanCart, readPlanCart, removePlanFromCart } from '../../../../lib/plan-cart';

export default function EnPlanCartPage() {
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
  const totalItems = rows.reduce((sum, row) => sum + row.quantity, 0);

  const checkout = () => {
    if (rows.length === 0) return;
    if (!getAccessTokenFromCookies()) {
      setShowAuthModal(true);
      return;
    }
    router.push(`/en/plans/${rows[0].plan.slug}/checkout`);
  };

  return (
    <main dir="ltr" className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">Plan Cart</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en/plans">
          Back to plans
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-8 p-6 text-center">
          <p className="text-foreground/80 text-sm">Your cart is empty.</p>
          <div className="mt-4">
            <Link href="/en/plans">
              <Button>Browse plans</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="grid gap-4">
            {rows.map((row) => (
              <Card key={row.slug} className="border-border p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-primary font-extrabold">{row.plan.name}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {getPlanSubtitle(row.plan, true)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {row.quantity} × {row.plan.priceOmr} OMR
                    </div>
                    <div className="text-foreground/75 mt-2 inline-flex rounded-full border border-border px-2 py-1 text-[11px] font-bold">
                      Monthly subscription
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-kaffza-info text-lg font-extrabold">{row.amount} OMR</div>
                    <button
                      className="mt-2 text-xs font-bold text-red-600 underline"
                      onClick={() => removePlanFromCart(row.slug)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-border p-5 shadow-sm lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Items</span>
              <span className="text-primary font-extrabold">{totalItems}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-primary font-extrabold">Total</span>
              <span className="text-kaffza-info text-2xl font-extrabold">{total} OMR</span>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              {total === 0
                ? 'This is a free plan and can be activated immediately without payment.'
                : 'Your selected plan is activated immediately after successful payment.'}
            </p>
            <div className="mt-4 grid gap-2">
              <Button className="w-full" onClick={checkout}>
                {total === 0 ? 'Continue free activation' : 'Continue to payment'}
              </Button>
              <Button variant="secondary" className="w-full" onClick={clearPlanCart}>
                Clear cart
              </Button>
            </div>
          </Card>
        </div>
      )}

      <RequireAuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} isEn />
    </main>
  );
}
