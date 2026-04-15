import Link from 'next/link';

import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export default function ContactPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">تواصل معنا</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">
        فريق Kaffza جاهز للمساعدة في إطلاق متجرك أو حل أي مشكلة تشغيلية.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-kaffza-primary text-lg font-extrabold">الدعم الفني</div>
          <div className="text-kaffza-text/80 mt-2 text-sm">
            للاستفسارات التقنية، مشاكل الدفع، أو إعداد المتجر.
          </div>
          <div className="mt-4">
            <a className="text-kaffza-primary font-bold underline" href="mailto:support@kaffza.com">
              support@kaffza.com
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-kaffza-primary text-lg font-extrabold">مبيعات واشتراكات</div>
          <div className="text-kaffza-text/80 mt-2 text-sm">
            لمساعدة التجار في اختيار الخطة المناسبة والبدء السريع.
          </div>
          <div className="mt-4">
            <a className="text-kaffza-primary font-bold underline" href="mailto:sales@kaffza.com">
              sales@kaffza.com
            </a>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/merchant/register">
          <Button>ابدأ كتاجر</Button>
        </Link>
        <Link href="/store">
          <Button variant="secondary">استكشف المتاجر</Button>
        </Link>
      </div>
    </main>
  );
}
