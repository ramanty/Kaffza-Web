import Link from "next/link";
import { Card } from "../../components/Card";

export default function HelpPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">مركز المساعدة</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/">الرئيسية</Link>
      </div>
      <p className="text-foreground/80 mt-3 text-sm">إجابات سريعة لأكثر الأسئلة شيوعًا، وطرق التواصل المباشر مع فريق قفزة.</p>
      <div className="mt-8 grid gap-4">
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">كيف أبدأ متجري؟</div>
          <div className="text-foreground/80 mt-2 text-sm">سجّل كتاجر، اختر الخطة المناسبة، أضف منتجاتك، وربط بوابة الدفع (ثواني) والشحن (جيناكم). المتجر جاهز فورًا.</div>
        </Card>
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">كيف تتم حماية المدفوعات؟</div>
          <div className="text-foreground/80 mt-2 text-sm">نستخدم نظام الضمان (Escrow): تُحتجز الأموال حتى يؤكد الزبون استلام الطلب. في حال نزاع، نبتّ خلال ٧ أيام عمل.</div>
        </Card>
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">ما هي طرق الدفع والشحن المدعومة؟</div>
          <div className="text-foreground/80 mt-2 text-sm">الدفع: ثواني (Thawani) + الدفع عند الاستلام + المحفظة + التقسيط. الشحن: جيناكم داخل سلطنة عُمان.</div>
        </Card>
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">أحتاج دعمًا فنيًا أو مساعدة في الاشتراك</div>
          <div className="text-foreground/80 mt-2 text-sm">تواصل معنا مباشرة:</div>
          <div className="mt-3 space-y-1 text-sm">
            <div>الدعم الفني: <a className="text-primary font-bold underline" href="mailto:support@kaffza.com">support@kaffza.com</a></div>
            <div>المبيعات والاشتراكات: <a className="text-primary font-bold underline" href="mailto:sales@kaffza.com">sales@kaffza.com</a></div>
            <div>الهاتف: <span dir="ltr">+968 7750 9646</span></div>
            <div>العنوان: المعبيلة الجنوبية، السيب، مسقط، سلطنة عُمان</div>
          </div>
        </Card>
      </div>
      <div className="mt-8">
        <Link href="/contact" className="text-primary font-bold underline">صفحة التواصل الكاملة</Link>
      </div>
    </main>
  );
}
