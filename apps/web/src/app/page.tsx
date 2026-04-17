'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '../components/Button';
import { PlanCardActions } from '../components/PlanCardActions';
import { FEATURE_CATALOG } from '../lib/feature-catalog';
import { PLAN_CATALOG } from '../lib/plan-catalog';
import { TRUST_CATALOG } from '../lib/trust-catalog';

const PAIN_POINTS = ['إرسال رقم حساب', 'طلبات ضائعة', 'عدم ثقة'];

const LANDING_FEATURES = FEATURE_CATALOG.slice(0, 6);

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
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <a
                href="https://kaffza.me"
                className="text-xl font-extrabold text-white transition hover:text-white/80"
                aria-label="Kaffza"
              >
                Kaffza
              </a>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/features" className="font-bold text-white/80 hover:text-white">
                  المميزات
                </Link>
                <Link href="/pricing" className="font-bold text-white/80 hover:text-white">
                  الأسعار
                </Link>
                <Link href="/contact" className="font-bold text-white/80 hover:text-white">
                  الدعم
                </Link>
                <Link href="/merchant/login" className="font-bold text-white/80 hover:text-white">
                  دخول التاجر
                </Link>
                <Link href="/login" className="font-bold text-white/80 hover:text-white">
                  دخول العميل
                </Link>
              </div>
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
                  <Button className="border border-white/60 bg-white !text-[#1B3A6B] shadow-sm hover:bg-slate-100">
                    سجّل كتاجر مجاناً
                  </Button>
                </Link>
                <a href="#features" className="inline-flex">
                  <Button variant="secondary">شاهد المميزات</Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/80">
                {TRUST_CATALOG.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/trust/${item.slug}`}
                    className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
                  >
                    {item.title}
                  </Link>
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

      <section id="features" className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-kaffza-primary text-2xl font-extrabold">
              6 مميزات أساسية في Kaffza
            </h2>
            <p className="text-kaffza-text/80 mt-2 text-sm">
              اضغط على أي ميزة لفتح صفحة شرح مفصلة.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURES.map((feature, idx) => (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-kaffza-primary text-3xl font-extrabold">{idx + 1}</div>
                <div className="text-kaffza-primary mt-3 text-sm font-extrabold">
                  {feature.titleAr}
                </div>
                <div className="text-kaffza-text/80 mt-2 text-sm">{feature.summaryAr}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">الأسعار</h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLAN_CATALOG.map((p) => (
            <div
              key={p.slug}
              className={
                'rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ' +
                (p.popular ? 'border-[#F5A623]' : 'border-black/10')
              }
            >
              <div className="flex items-center justify-between">
                <div className="text-kaffza-primary text-sm font-extrabold">
                  {p.name} ({p.subtitle})
                </div>
                {p.popular ? (
                  <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-extrabold text-white">
                    الأكثر شعبية
                  </span>
                ) : null}
              </div>

              <div className="text-kaffza-info mt-4 text-3xl font-extrabold">
                {p.priceOmr} ر.ع <span className="text-kaffza-text/60 text-sm font-bold">/شهر</span>
              </div>

              <ul className="text-kaffza-text/80 mt-5 space-y-2 text-sm">
                {p.notes.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <span className="text-kaffza-primary mt-0.5">✓</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              <PlanCardActions slug={p.slug} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">الثقة والأمان</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TRUST_CATALOG.map((item) => (
              <Link
                key={item.slug}
                href={`/trust/${item.slug}`}
                className="rounded-2xl border border-black/10 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-kaffza-primary text-sm font-extrabold">{item.title}</div>
                <div className="text-kaffza-text/80 mt-2 text-xs">{item.summary}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link className="text-kaffza-primary text-sm font-bold underline" href="/trust">
              عرض كل صفحات الثقة والأمان
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <a
                href="https://kaffza.me"
                className="text-kaffza-primary text-lg font-extrabold transition hover:opacity-80"
              >
                Kaffza
              </a>
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
              <Link className="text-kaffza-primary font-bold underline" href="/features">
                المميزات
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/pricing">
                الأسعار
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/contact">
                تواصل معنا
              </Link>
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

export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageInner />
    </Suspense>
  );
}
