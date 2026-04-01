import Link from 'next/link';
import { Button } from '../components/Button';

export default function NotFound() {
  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16">
      <div className="text-5xl font-extrabold text-kaffza-primary">404</div>
      <div className="mt-4 text-xl font-extrabold text-kaffza-text">الصفحة غير موجودة</div>
      <div className="mt-2 text-sm text-kaffza-text/70">الصفحة التي تبحث عنها ربما تم نقلها أو حذفها.</div>
      <div className="mt-8">
        <Link href="/">
          <Button>العودة للرئيسية</Button>
        </Link>
      </div>
    </main>
  );
}
