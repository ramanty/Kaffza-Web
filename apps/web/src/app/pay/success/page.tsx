'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

function PaySuccessInner() {
  const sp = useSearchParams();

  const storeId = sp.get('storeId');
  const orderId = sp.get('orderId');
  const subdomain = sp.get('subdomain');
  const isEn = sp.get('lang') === 'en';
  const withLang = (path: string) =>
    isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;

  // Some Thawani redirects may include session_id/sessionId
  const sessionId = sp.get('session_id') || sp.get('sessionId') || sp.get('session');

  const [status, setStatus] = useState<string>('checking');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCheck = useMemo(
    () => !!sessionId || (!!storeId && !!orderId),
    [sessionId, storeId, orderId]
  );

  const checkStatus = async () => {
    if (!canCheck) return;
    setError(null);

    try {
      if (sessionId) {
        const res = await api.get(`/payments/${encodeURIComponent(sessionId)}/status`, {
          headers: { ...authHeader(), 'x-client': 'web' },
        });
        setStatus(res?.data?.data?.paymentStatus || 'unknown');
        setInvoice(res?.data?.data?.invoice || null);
        return;
      }

      const res = await api.get(`/stores/${storeId}/payments/status/${orderId}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setStatus(res?.data?.data?.paymentStatus || 'unknown');
      setInvoice(res?.data?.data?.invoice || null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          (isEn ? 'Could not verify payment status' : 'تعذر التحقق من حالة الدفع')
      );
      setStatus('unknown');
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll while pending
    const id = setInterval(() => {
      if (status === 'pending' || status === 'checking') checkStatus();
    }, 4000);
    return () => clearInterval(id);
     
  }, [storeId, orderId, sessionId, status]);

  return (
    <main dir={isEn ? 'ltr' : 'rtl'} className="mx-auto max-w-2xl px-6 py-12">
      <Card className="p-8">
        <div className="text-primary text-2xl font-extrabold">
          {isEn ? 'Payment status' : 'نتيجة الدفع'}
        </div>

        {!canCheck ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {isEn
              ? 'Payment details are incomplete. Please go back and try again.'
              : 'معلومات الدفع غير مكتملة. يرجى الرجوع للمحاولة مرة أخرى.'}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="bg-background text-foreground mt-4 rounded-xl p-4 text-sm">
          <div>
            {isEn ? 'Status: ' : 'الحالة: '}
            <span className="text-primary font-extrabold">{status}</span>
          </div>
          {invoice ? (
            <div className="text-muted-foreground mt-1 text-xs">Invoice: {invoice}</div>
          ) : null}
        </div>
        {status === 'paid' ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {isEn
              ? 'Payment completed successfully. You can now track order progress.'
              : 'تم الدفع بنجاح. يمكنك الآن متابعة حالة الطلب.'}
          </div>
        ) : null}
        {status === 'pending' || status === 'checking' ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            {isEn
              ? 'Payment is still processing. Keep this page open and refresh status.'
              : 'الدفع ما زال قيد المعالجة. ابقَ في الصفحة وقم بتحديث الحالة.'}
          </div>
        ) : null}
        {status !== 'paid' && status !== 'pending' && status !== 'checking' ? (
          <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
            {isEn
              ? 'Payment is not completed yet. Retry payment using the existing order (no duplicate order needed).'
              : 'الدفع غير مكتمل حتى الآن. أعد المحاولة باستخدام نفس الطلب (لن يتم إنشاء طلب جديد).'}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={checkStatus}>
            {isEn ? 'Refresh status' : 'تحديث الحالة'}
          </Button>

          {subdomain ? (
            <Link href={withLang(`/store/${subdomain}`)}>
              <Button variant="secondary">{isEn ? 'Back to store' : 'رجوع للمتجر'}</Button>
            </Link>
          ) : (
            <Link href={withLang('/store')}>
              <Button variant="secondary">{isEn ? 'Store list' : 'قائمة المتاجر'}</Button>
            </Link>
          )}

          {subdomain && orderId ? (
            <Link
              href={withLang(`/store/${subdomain}/checkout?orderId=${encodeURIComponent(orderId)}`)}
            >
              <Button>{isEn ? 'Retry payment' : 'حاول الدفع مرة ثانية'}</Button>
            </Link>
          ) : null}
          {orderId ? (
            <Link href={withLang(`/account/orders/${encodeURIComponent(orderId)}`)}>
              <Button variant="secondary">
                {isEn ? 'Open order details' : 'فتح تفاصيل الطلب'}
              </Button>
            </Link>
          ) : null}
        </div>

        <div className="text-muted-foreground mt-6 text-xs">
          {isEn
            ? 'Note: In Sandbox mode, status may take a few seconds to update.'
            : 'ملاحظة: في وضع الاختبار (Sandbox) قد تتأخر الحالة عدة ثواني.'}
        </div>
      </Card>
    </main>
  );
}

export default function PaySuccess() {
  return (
    <Suspense>
      <PaySuccessInner />
    </Suspense>
  );
}
