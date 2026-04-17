'use client';

import Link from 'next/link';

import { Button } from './Button';

export function RequireAuthModal({
  open,
  onClose,
  isEn = false,
}: {
  open: boolean;
  onClose: () => void;
  isEn?: boolean;
}) {
  if (!open) return null;
  const loginHref = isEn
    ? '/merchant/login?next=/en/plans/cart'
    : '/merchant/login?next=/plans/cart';
  const registerHref = isEn
    ? '/merchant/register?next=/en/plans/cart'
    : '/merchant/register?next=/plans/cart';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        dir={isEn ? 'ltr' : 'rtl'}
      >
        <h3 className="text-kaffza-primary text-lg font-extrabold">
          {isEn ? 'Login required' : 'تسجيل الدخول مطلوب'}
        </h3>
        <p className="text-kaffza-text/80 mt-2 text-sm">
          {isEn
            ? 'You need to register or login before completing the payment.'
            : 'تحتاج إلى التسجيل أو تسجيل الدخول قبل إكمال عملية الدفع.'}
        </p>

        <div className="mt-5 grid gap-2">
          <Link href={loginHref}>
            <Button className="w-full">{isEn ? 'Login' : 'تسجيل الدخول'}</Button>
          </Link>
          <Link href={registerHref}>
            <Button variant="secondary" className="w-full">
              {isEn ? 'Create account' : 'إنشاء حساب'}
            </Button>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-kaffza-text/70 mt-1 text-xs font-bold underline"
          >
            {isEn ? 'Close' : 'إغلاق'}
          </button>
        </div>
      </div>
    </div>
  );
}
