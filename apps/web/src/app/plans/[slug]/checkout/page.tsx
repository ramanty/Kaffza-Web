'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { RequireAuthModal } from '../../../../components/RequireAuthModal';
import { getAccessTokenFromCookies } from '../../../../lib/auth';
import { getPlanBySlug } from '../../../../lib/plan-catalog';

export default function PlanCheckoutPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const plan = useMemo(() => getPlanBySlug(params.slug), [params.slug]);

  if (!plan) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-6 py-12">
        <Card className="p-6 text-center">
          <p className="text-kaffza-text/80 text-sm">الخطة غير موجودة</p>
          <div className="mt-4">
            <Link href="/plans">
              <Button>العودة للخطط</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const pay = () => {
    if (!getAccessTokenFromCookies()) {
      setShowAuthModal(true);
      return;
    }
    router.push('/pay/success');
  };

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">دفع خطة {plan.name}</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/plans/cart">
          العودة للسلة
        </Link>
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-kaffza-primary font-extrabold">
              {plan.name} ({plan.subtitle})
            </div>
            <div className="text-kaffza-text/70 mt-1 text-sm">اشتراك شهري</div>
          </div>
          <div className="text-kaffza-info text-2xl font-extrabold">{plan.priceOmr} ر.ع</div>
        </div>

        <div className="bg-kaffza-bg text-kaffza-text/85 mt-6 rounded-xl border border-black/10 p-4 text-sm">
          بعد تأكيد الدفع سيتم تفعيل اشتراك الخطة على حسابك.
        </div>

        <div className="mt-6 grid gap-2">
          <Button className="w-full" onClick={pay}>
            تأكيد والدفع الآن
          </Button>
          <Link href={`/plans/${plan.slug}`}>
            <Button variant="secondary" className="w-full">
              الرجوع لتفاصيل الخطة
            </Button>
          </Link>
        </div>
      </Card>

      <RequireAuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
