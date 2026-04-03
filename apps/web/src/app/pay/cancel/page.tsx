'use client';
import { Suspense } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

function PayCancelInner() {
  const sp = useSearchParams();

  const orderId = sp.get('orderId');
  const subdomain = sp.get('subdomain');

  const retryHref = subdomain && orderId ? `/store/${subdomain}/checkout?orderId=${encodeURIComponent(orderId)}` : '/store';

  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-6 py-12">
      <Card className="p-8">
        <div className="text-2xl font-extrabold text-kaffza-primary">تم إلغاء الدفع</div>
        <div className="mt-2 text-sm text-kaffza-text">
          ما في مشكلة — تقدر تحاول مرة ثانية.
        </div>

        <div className="mt-5 rounded-xl bg-kaffza-bg p-4 text-sm text-kaffza-text">
          {orderId ? (
            <div>
              رقم الطلب: <span className="font-extrabold text-kaffza-primary">{orderId}</span>
            </div>
          ) : (
            <div>لم يتم العثور على رقم الطلب.</div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={retryHref}>
            <Button>حاول مرة ثانية</Button>
          </Link>

          {subdomain ? (
            <Link href={`/store/${subdomain}/cart`}>
              <Button variant="secondary">رجوع للسلة</Button>
            </Link>
          ) : (
            <Link href="/store">
              <Button variant="secondary">قائمة المتاجر</Button>
            </Link>
          )}
        </div>
      </Card>
    </main>
  );
}

export default function PayCancel() { return <Suspense><PayCancelInner /></Suspense>; }
