'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../components/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <main
      dir="rtl"
      className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16"
    >
      <div className="text-kaffza-primary text-5xl font-extrabold">500</div>
      <div className="text-kaffza-text mt-4 text-xl font-extrabold">عذراً، حدث خطأ غير متوقع</div>
      <div className="text-kaffza-text/70 mt-2 text-sm">
        نعتذر عن هذا الخلل. فريقنا الفني تم إبلاغه وجاري العمل على حله.
      </div>
      <div className="mt-8 flex gap-4">
        <Button onClick={() => reset()}>حاول مرة أخرى</Button>
        <Link href="/">
          <Button variant="outline">العودة للرئيسية</Button>
        </Link>
      </div>
    </main>
  );
}
