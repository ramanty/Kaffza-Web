'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '../components/Button';

const PRICING = [
  {
    key: 'starter',
    name: 'Starter',
    price: 5,
    features: ['متجر إلكتروني كامل', 'حتى 100 منتج', 'دعم فني أساسي', 'تقارير أساسية'],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 8,
    popular: true,
    features: ['حتى 1000 منتج', 'كوبونات وخصومات', 'تقارير متقدمة', 'دعم فني متقدم'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 35,
    features: ['منتجات غير محدودة', 'دعم VIP', 'تقارير متقدمة جداً', 'ميزات مخصصة'],
  },
];

const FEATURES = [
  { icon: '🏪', title: 'متجر احترافي', desc: 'واجهة سريعة ومتجاوبة تعكس علامتك التجارية.' },
  { icon: '💳', title: 'دفع آمن عبر Thawani', desc: 'جلسات دفع مباشرة مع تجربة سلسة وآمنة.' },
  { icon: '📊', title: 'لوحة تحكم كاملة', desc: 'منتجات، طلبات، تقارير، وإدارة متجرك من مكان واحد.' },
  { icon: '🗣️', title: 'دعم عربي كامل', desc: 'تجربة RTL عربية بالكامل مع دعم محلي.' },
  { icon: '🛡️', title: 'نظام حماية الأموال (Escrow)', desc: 'حماية للطرفين عبر نظام حجز وإفراج آمن.' },
  { icon: '📱', title: 'تطبيق موبايل قريباً', desc: 'تجربة تسوق وإدارة على الهاتف قريباً.' },
];

export default function LandingPage() {
  const sp = useSearchParams();
  const unauthorized = sp.get('unauthorized') === '1';

  const howHref = useMemo(() => '#features', []);

  return (
    <main dir="rtl" className="bg-white text-kaffza-text">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2A5298 100%)' }}
      >
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xl font-extrabold text-white">Kaffza</div>
            <div className="flex items-center gap-2">
              <Link href="/merchant/login" className="text-sm font-bold text-white/80 hover:text-white">
                دخول التاجر
              </Link>
              <Link href="/login" className="text-sm font-bold text-white/80 hover:text-white">
                دخول العميل
              </Link>
            </div>
          </div>

          {unauthorized ? (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold text-white">
              غير مصرح
            </div>
          ) : null}

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                ابنِ متجرك الإلكتروني في دقائق
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85">
                أول منصة عُمانية لبناء المتاجر الإلكترونية — سهلة، آمنة، وبدعم محلي
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/merchant/register">
                  <Button variant="premium">ابدأ مجاناً</Button>
                </Link>
                <a href={howHref} className="inline-flex">
                  <Button variant="secondary">شاهد كيف يعمل</Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/80">
                <span className="rounded-full bg-white/10 px-3 py-1">Thawani جاهز</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Escrow</span>
                <span className="rounded-full bg-white/10 px-3 py-1">RTL عربي</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                <div className="text-sm font-extrabold text-white">نظرة سريعة</div>
                <div className="mt-4 grid gap-3">
                  <Stat label="متاجر" value="+100" />
                  <Stat label="دفع" value="Thawani" />
                  <Stat label="حماية" value="Escrow" />
                </div>
                <div className="mt-6 text-xs text-white/70">* أرقام تجريبية للعرض</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold text-kaffza-primary">المميزات</h2>
          <p className="mt-2 text-sm text-kaffza-text/80">كل ما تحتاجه لتبيع بثقة، من الدفع إلى إدارة الطلبات.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-2xl">{f.icon}</div>
              <div className="mt-3 text-sm font-extrabold text-kaffza-primary">{f.title}</div>
              <div className="mt-2 text-sm text-kaffza-text/80">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold text-kaffza-primary">الأسعار</h2>
            <p className="mt-2 text-sm text-kaffza-text/80">اختر الخطة المناسبة وابدأ اليوم.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PRICING.map((p) => (
              <div
                key={p.key}
                className={
                  'rounded-2xl border bg-white p-6 ' +
                  (p.popular ? 'border-[#F5A623]' : 'border-black/10')
                }
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-kaffza-primary">{p.name}</div>
                  {p.popular ? (
                    <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-extrabold text-white">
                      الأكثر شعبية
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 text-3xl font-extrabold text-kaffza-info">
                  {p.price} ر.ع <span className="text-sm font-bold text-kaffza-text/60">/شهر</span>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-kaffza-text/80">
                  {p.features.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-0.5 text-kaffza-primary">✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link href="/merchant/register">
                    <Button className="w-full">ابدأ الآن</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold text-kaffza-primary">كيف يعمل</h2>
          <p className="mt-2 text-sm text-kaffza-text/80">3 خطوات وتبدأ البيع.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <HowStep n="1" title="سجّل" desc="أنشئ حساب تاجر خلال دقائق." />
          <HowStep n="2" title="أنشئ متجرك" desc="اختر الرابط والخطة وابدأ التجربة." />
          <HowStep n="3" title="ابدأ البيع" desc="أضف منتجاتك وابدأ باستقبال الطلبات." />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-lg font-extrabold text-kaffza-primary">Kaffza</div>
              <div className="mt-2 text-sm text-kaffza-text/70">منصة قفزة لبناء المتاجر الإلكترونية.</div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link className="font-bold text-kaffza-primary underline" href="/legal/privacy">
                سياسة الخصوصية
              </Link>
              <Link className="font-bold text-kaffza-primary underline" href="/legal/terms">
                الشروط والأحكام
              </Link>
              <a className="font-bold text-kaffza-primary underline" href="mailto:support@kaffza.com">
                تواصل معنا
              </a>
            </div>
          </div>

          <div className="mt-8 text-xs text-kaffza-text/60">© 2025 جوهرة الشهباء الحديثة ش.م.م</div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-white">
      <div className="text-xs font-bold text-white/80">{label}</div>
      <div className="text-sm font-extrabold">{value}</div>
    </div>
  );
}

function HowStep({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="text-4xl font-extrabold text-kaffza-primary">{n}</div>
      <div className="mt-3 text-sm font-extrabold text-kaffza-primary">{title}</div>
      <div className="mt-2 text-sm text-kaffza-text/80">{desc}</div>
    </div>
  );
}
