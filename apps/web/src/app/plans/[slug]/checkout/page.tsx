'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { RequireAuthModal } from '../../../../components/RequireAuthModal';
import { getAccessTokenFromCookies } from '../../../../lib/auth';
import { getPlanBySlug, getPlanSubtitle } from '../../../../lib/plan-catalog';

export default function PlanCheckoutPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const plan = useMemo(() => getPlanBySlug(params.slug), [params.slug]);

  if (!plan) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-6 py-12">
        <Card className="p-6 text-center">
          <p className="text-foreground/80 text-sm">الخطة غير موجودة</p>
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
    if (plan.priceOmr === 0) {
      router.push('/onboarding');
      return;
    }
    router.push('/pay/success');
  };

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">دفع خطة {plan.name}</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/plans/cart">
          العودة للسلة
        </Link>
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-primary font-extrabold">
              {plan.name} ({getPlanSubtitle(plan)})
            </div>
            <div className="text-muted-foreground mt-1 text-sm">
              {plan.priceOmr === 0 ? 'تفعيل مجاني' : 'اشتراك شهري'}
            </div>
          </div>
          <div className="text-kaffza-info text-2xl font-extrabold">{plan.priceOmr} ر.ع</div>
        </div>

        <div className="bg-background text-foreground/85 mt-6 rounded-xl border border-border p-4 text-sm">
          {plan.priceOmr === 0
            ? 'هذه الخطة مجانية. بعد التأكيد سيتم نقلك لإعداد المتجر مباشرة.'
            : 'بعد تأكيد الدفع سيتم تفعيل اشتراك الخطة على حسابك.'}
        </div>

        <div className="mt-6 grid gap-2">
          <Button className="w-full" onClick={pay}>
            {plan.priceOmr === 0 ? 'تأكيد وتفعيل مجاناً' : 'تأكيد والدفع الآن'}
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
