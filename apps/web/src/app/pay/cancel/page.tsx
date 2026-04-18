'use client';
import { useCallback, useEffect, useState } from 'react';
import { Suspense } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';

function PayCancelInner() {
  const sp = useSearchParams();

  const orderId = sp.get('orderId');
  const storeId = sp.get('storeId');
  const subdomain = sp.get('subdomain');
  const isEn = sp.get('lang') === 'en';
  const withLang = (path: string) =>
    isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryHref =
    subdomain && orderId
      ? withLang(`/store/${subdomain}/checkout?orderId=${encodeURIComponent(orderId)}`)
      : withLang('/store');

  const checkPaymentStatus = useCallback(async () => {
    if (!storeId || !orderId) return;
    setChecking(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/payments/status/${orderId}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setStatus(res?.data?.data?.paymentStatus || 'unknown');
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          (isEn ? 'Could not check payment status right now.' : 'تعذر التحقق من حالة الدفع حالياً.')
      );
    } finally {
      setChecking(false);
    }
  }, [isEn, orderId, storeId]);

  useEffect(() => {
    checkPaymentStatus();
  }, [checkPaymentStatus]);

  return (
    <main dir={isEn ? 'ltr' : 'rtl'} className="mx-auto max-w-2xl px-6 py-12">
      <Card className="p-8">
        <div className="text-kaffza-primary text-2xl font-extrabold">
          {isEn ? 'Payment cancelled' : 'تم إلغاء الدفع'}
        </div>
        <div className="text-kaffza-text mt-2 text-sm">
          {isEn ? 'No worries — you can try again.' : 'ما في مشكلة — تقدر تحاول مرة ثانية.'}
        </div>
        {status === 'paid' ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {isEn
              ? 'Good news: payment is already marked as paid. Open payment status to continue.'
              : 'خبر جيد: الدفع مسجّل كمدفوع. افتح صفحة حالة الدفع للمتابعة.'}
          </div>
        ) : null}
        {status && status !== 'paid' ? (
          <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
            {isEn
              ? `Current status: ${status}. You can safely retry payment without creating a new order.`
              : `الحالة الحالية: ${status}. يمكنك إعادة المحاولة بأمان دون إنشاء طلب جديد.`}
          </div>
        ) : null}
        {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}

        <div className="bg-kaffza-bg text-kaffza-text mt-5 rounded-xl p-4 text-sm">
          {orderId ? (
            <div>
              {isEn ? 'Order ID: ' : 'رقم الطلب: '}
              <span className="text-kaffza-primary font-extrabold">{orderId}</span>
            </div>
          ) : (
            <div>{isEn ? 'Order ID was not found.' : 'لم يتم العثور على رقم الطلب.'}</div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={retryHref}>
            <Button>{isEn ? 'Try again' : 'حاول مرة ثانية'}</Button>
          </Link>
          {storeId && orderId ? (
            <Link
              href={withLang(
                `/pay/success?storeId=${encodeURIComponent(storeId)}&orderId=${encodeURIComponent(orderId)}${subdomain ? `&subdomain=${encodeURIComponent(subdomain)}` : ''}`
              )}
            >
              <Button variant="secondary">
                {isEn ? 'Check payment status' : 'تحقق من حالة الدفع'}
              </Button>
            </Link>
          ) : null}
          <Button
            variant="secondary"
            onClick={checkPaymentStatus}
            disabled={checking || !storeId || !orderId}
          >
            {checking
              ? isEn
                ? 'Checking...'
                : 'جارٍ التحقق...'
              : isEn
                ? 'Refresh status'
                : 'تحديث الحالة'}
          </Button>

          {subdomain ? (
            <Link href={withLang(`/store/${subdomain}/cart`)}>
              <Button variant="secondary">{isEn ? 'Back to cart' : 'رجوع للسلة'}</Button>
            </Link>
          ) : (
            <Link href={withLang('/store')}>
              <Button variant="secondary">{isEn ? 'Store list' : 'قائمة المتاجر'}</Button>
            </Link>
          )}
        </div>
      </Card>
    </main>
  );
}

export default function PayCancel() {
  return (
    <Suspense>
      <PayCancelInner />
    </Suspense>
  );
}
