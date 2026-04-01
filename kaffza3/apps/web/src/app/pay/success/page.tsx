'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function PaySuccess() {
  const sp = useSearchParams();

  const storeId = sp.get('storeId');
  const orderId = sp.get('orderId');
  const subdomain = sp.get('subdomain');

  // Some Thawani redirects may include session_id/sessionId
  const sessionId = sp.get('session_id') || sp.get('sessionId') || sp.get('session');

  const [status, setStatus] = useState<string>('checking');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCheck = useMemo(() => !!sessionId || (!!storeId && !!orderId), [sessionId, storeId, orderId]);

  const checkStatus = async () => {
    if (!canCheck) return;
    setError(null);

    try {
      if (sessionId) {
        const res = await api.get(`/payments/${encodeURIComponent(sessionId)}/status`, { headers: { ...authHeader(), 'x-client': 'web' } });
        setStatus(res?.data?.data?.paymentStatus || 'unknown');
        setInvoice(res?.data?.data?.invoice || null);
        return;
      }

      const res = await api.get(`/stores/${storeId}/payments/status/${orderId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setStatus(res?.data?.data?.paymentStatus || 'unknown');
      setInvoice(res?.data?.data?.invoice || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'تعذر التحقق من حالة الدفع');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, orderId, sessionId, status]);

  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-6 py-12">
      <Card className="p-8">
        <div className="text-2xl font-extrabold text-kaffza-primary">نتيجة الدفع</div>

        {!canCheck ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            معلومات الدفع غير مكتملة. يرجى الرجوع للمحاولة مرة أخرى.
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-4 rounded-xl bg-kaffza-bg p-4 text-sm text-kaffza-text">
          <div>
            الحالة: <span className="font-extrabold text-kaffza-primary">{status}</span>
          </div>
          {invoice ? <div className="mt-1 text-xs text-kaffza-text/70">Invoice: {invoice}</div> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={checkStatus}>
            تحديث الحالة
          </Button>

          {subdomain ? (
            <Link href={`/store/${subdomain}`}>
              <Button variant="secondary">رجوع للمتجر</Button>
            </Link>
          ) : (
            <Link href="/store">
              <Button variant="secondary">قائمة المتاجر</Button>
            </Link>
          )}

          {subdomain && orderId ? (
            <Link href={`/store/${subdomain}/checkout?orderId=${encodeURIComponent(orderId)}`}>
              <Button>حاول الدفع مرة ثانية</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6 text-xs text-kaffza-text/70">
          ملاحظة: في وضع الاختبار (Sandbox) قد تتأخر الحالة عدة ثواني.
        </div>
      </Card>
    </main>
  );
}
