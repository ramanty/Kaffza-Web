'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '../components/Button';

const PAIN_POINTS = ['إرسال رقم حساب', 'طلبات ضائعة', 'عدم ثقة'];

const HOW_STEPS = [
  { n: '1', title: 'إنشاء متجر', desc: 'افتح حسابك وأنشئ متجرك في دقائق.' },
  { n: '2', title: 'إضافة منتجات', desc: 'أضف منتجاتك وسعرك وصورك بسرعة.' },
  { n: '3', title: 'مشاركة الرابط', desc: 'أرسل رابط متجرك وابدأ استقبال الطلبات.' },
];

const PRICING = [
  {
    key: 'starter',
    name: 'Starter',
    price: 5,
    features: ['متجر إلكتروني جاهز', 'ربط دفع عبر ثواني باي', 'دعم فني أساسي'],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 8,
    popular: true,
    features: ['حتى 1000 منتج', 'كوبونات وخصومات', 'دعم فني متقدم'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 35,
    features: ['منتجات غير محدودة', 'دعم VIP', 'أولوية أعلى'],
  },
];

const TRUST_BADGES = ['Escrow', 'ثواني باي', 'Made in Oman'];

function LandingPageInner() {
  const sp = useSearchParams();
  const unauthorized = sp.get('unauthorized') === '1';

  return (
    <main dir="rtl" className="text-kaffza-text bg-white">
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2A5298 100%)' }}
      >
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xl font-extrabold text-white">Kaffza</div>
            <div className="flex items-center gap-2">
              <Link
                href="/merchant/login"
                className="text-sm font-bold text-white/80 hover:text-white"
              >
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
              <div className="flex flex-wrap gap-2 text-xs text-white/80">
                {PAIN_POINTS.map((pain) => (
                  <span key={pain} className="rounded-full bg-white/10 px-3 py-1">
                    {pain}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                افتح متجرك الإلكتروني في عُمان — في 10 دقائق
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85">
                تبيع عبر إنستغرام؟ كافظة تعطيك متجر جاهز + دفع عبر ثواني باي
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/merchant/register">
                  <Button variant="premium">افتح متجرك الآن</Button>
                </Link>
                <a href="#how" className="inline-flex">
                  <Button variant="secondary">شاهد الخطوات</Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/80">
                {TRUST_BADGES.map((badge) => (
                  <span key={badge} className="rounded-full bg-white/10 px-3 py-1">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                <div className="text-sm font-extrabold text-white">لماذا Kaffza؟</div>
                <div className="mt-4 grid gap-3">
                  <Stat label="الإطلاق" value="10 دقائق" />
                  <Stat label="الدفع" value="ثواني باي" />
                  <Stat label="الحماية" value="Escrow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pain" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">هل تعاني من؟</h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PAIN_POINTS.map((pain) => (
            <div key={pain} className="rounded-2xl border border-black/10 bg-white p-6 text-center">
              <div className="text-kaffza-primary text-lg font-extrabold">{pain}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-kaffza-primary text-2xl font-extrabold">3 خطوات وتبدأ البيع</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {HOW_STEPS.map((step) => (
              <HowStep key={step.n} n={step.n} title={step.title} desc={step.desc} />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">الأسعار</h2>
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
                <div className="text-kaffza-primary text-sm font-extrabold">{p.name}</div>
                {p.popular ? (
                  <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-extrabold text-white">
                    الأكثر شعبية
                  </span>
                ) : null}
              </div>

              <div className="text-kaffza-info mt-4 text-3xl font-extrabold">
                {p.price} ر.ع <span className="text-kaffza-text/60 text-sm font-bold">/شهر</span>
              </div>

              <ul className="text-kaffza-text/80 mt-5 space-y-2 text-sm">
                {p.features.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <span className="text-kaffza-primary mt-0.5">✓</span>
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
      </section>

      <section className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">الثقة والأمان</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge}
                className="text-kaffza-primary rounded-2xl border border-black/10 bg-white p-6 text-center text-sm font-extrabold"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-kaffza-primary text-lg font-extrabold">Kaffza</div>
              <div className="text-kaffza-text/70 mt-2 text-sm">
                منصة عُمانية للتجارة الإلكترونية — Ship or die.
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link className="text-kaffza-primary font-bold underline" href="/legal/privacy">
                سياسة الخصوصية
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/legal/terms">
                الشروط والأحكام
              </Link>
              <a
                className="text-kaffza-primary font-bold underline"
                href="mailto:support@kaffza.com"
              >
                تواصل معنا
              </a>
            </div>
          </div>

          <div className="text-kaffza-text/60 mt-8 text-xs">© 2025 جوهرة الشهباء الحديثة ش.م.م</div>
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
      <div className="text-kaffza-primary text-4xl font-extrabold">{n}</div>
      <div className="text-kaffza-primary mt-3 text-sm font-extrabold">{title}</div>
      <div className="text-kaffza-text/80 mt-2 text-sm">{desc}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageInner />
    </Suspense>
  );
}
