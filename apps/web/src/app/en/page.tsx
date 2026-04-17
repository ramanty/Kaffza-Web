'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '../../components/Button';
import { PlanCardActions } from '../../components/PlanCardActions';
import { FEATURE_CATALOG } from '../../lib/feature-catalog';
import { PLAN_CATALOG } from '../../lib/plan-catalog';
import { TRUST_CATALOG } from '../../lib/trust-catalog';

const PAIN_POINTS = ['Manual bank details', 'Lost orders', 'Low trust'];
const LANDING_FEATURES = FEATURE_CATALOG.slice(0, 6);

function EnLandingPageInner() {
  const sp = useSearchParams();
  const unauthorized = sp.get('unauthorized') === '1';

  return (
    <main dir="ltr" className="text-kaffza-text bg-white">
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2A5298 100%)' }}
      >
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-8 sm:pb-24 sm:pt-10">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <a
                href="https://kaffza.me"
                className="text-xl font-extrabold text-white transition hover:text-white/80"
                aria-label="Kaffza"
              >
                Kaffza
              </a>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link href="/en/features" className="font-bold text-white/80 hover:text-white">
                  Features
                </Link>
                <Link href="/en/pricing" className="font-bold text-white/80 hover:text-white">
                  Pricing
                </Link>
                <Link href="/en/contact" className="font-bold text-white/80 hover:text-white">
                  Support
                </Link>
                <Link
                  href="/en/merchant/login"
                  className="font-bold text-white/80 hover:text-white"
                >
                  Merchant Login
                </Link>
                <Link href="/en/login" className="font-bold text-white/80 hover:text-white">
                  Customer Login
                </Link>
                <Link href="/en/merchant/register" className="inline-flex">
                  <Button className="h-9 border border-white/60 bg-white !px-4 !py-0 !text-[#1B3A6B] shadow-sm hover:bg-slate-100">
                    Start now
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {unauthorized ? (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold text-white">
              Unauthorized
            </div>
          ) : null}

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white/90">
                Built for Oman merchants and local buying behavior
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/80">
                {PAIN_POINTS.map((pain) => (
                  <span key={pain} className="rounded-full bg-white/10 px-3 py-1">
                    {pain}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl sm:leading-tight">
                Launch your Oman online store in 10 minutes
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
                Kaffza gives you a production-ready store, local Thawani payment, and Escrow
                protection to increase conversion with trust.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/en/merchant/register">
                  <Button className="border border-white/60 bg-white !text-[#1B3A6B] shadow-sm hover:bg-slate-100">
                    Register as merchant
                  </Button>
                </Link>
                <Link href="/en/pricing" className="inline-flex">
                  <Button
                    variant="secondary"
                    className="border-white/40 bg-white/10 !text-white hover:bg-white/20"
                  >
                    Compare plans
                  </Button>
                </Link>
              </div>

              <p className="mt-4 text-xs text-white/75">No credit card required • Fast setup</p>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/80">
                {TRUST_CATALOG.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/en/trust/${item.slug}`}
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
              <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur sm:p-7">
                <div className="text-sm font-extrabold text-white">Why Kaffza?</div>
                <div className="mt-4 grid gap-3">
                  <Stat label="Setup" value="10 min" />
                  <Stat label="Payments" value="Thawani" />
                  <Stat label="Protection" value="Escrow" />
                </div>
                <div className="mt-6 rounded-2xl bg-white/10 p-4 text-xs leading-6 text-white/85">
                  Faster launch + reliable checkout + practical operations tools in one place.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pain" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">
            Do these problems sound familiar?
          </h2>
          <p className="text-kaffza-text/70 mt-2 text-sm">
            These are the most common blockers when selling without a structured storefront.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PAIN_POINTS.map((pain) => (
            <div
              key={pain}
              className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm"
            >
              <div className="text-kaffza-primary text-lg font-extrabold">{pain}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-kaffza-primary text-2xl font-extrabold">
              6 core features in Kaffza
            </h2>
            <p className="text-kaffza-text/80 mt-2 text-sm">
              Click any feature card to open a detailed explanation page.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURES.map((feature, idx) => (
              <Link
                key={feature.slug}
                href={`/en/features/${feature.slug}`}
                className="rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-kaffza-primary text-3xl font-extrabold">{idx + 1}</div>
                <div className="text-kaffza-primary mt-3 text-sm font-extrabold">
                  {feature.titleEn}
                </div>
                <div className="text-kaffza-text/80 mt-2 text-sm">{feature.summaryEn}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl">
          <h2 className="text-kaffza-primary text-2xl font-extrabold">Pricing</h2>
          <p className="text-kaffza-text/70 mt-2 text-sm">
            Clear plan options by growth stage with transparent fees and actions.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PLAN_CATALOG.map((p) => (
            <div
              key={p.slug}
              className={
                'flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ' +
                (p.popular ? 'border-[#F5A623] ring-1 ring-[#F5A623]/30' : 'border-black/10')
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-kaffza-primary text-sm font-extrabold">{p.name}</div>
                  <div className="text-kaffza-text/60 mt-1 text-xs">{p.subtitle}</div>
                </div>
                {p.popular ? (
                  <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-extrabold text-white">
                    Most popular
                  </span>
                ) : null}
              </div>

              <div className="text-kaffza-info mt-4 text-3xl font-extrabold">
                {p.priceOmr} OMR{' '}
                <span className="text-kaffza-text/60 text-sm font-bold">/month</span>
              </div>
              <div className="text-kaffza-text/70 mt-1 text-xs">Commission: {p.commission}</div>

              <ul className="text-kaffza-text/80 mt-5 flex-1 space-y-2 text-sm">
                {p.notes.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <span className="text-kaffza-primary mt-0.5">✓</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              <PlanCardActions slug={p.slug} isEn />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-kaffza-bg">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-kaffza-primary text-2xl font-extrabold">Trust & Safety</h2>
            <p className="text-kaffza-text/70 mt-2 text-sm">
              Credibility blocks that improve checkout confidence for both merchant and customer.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TRUST_CATALOG.map((item) => (
              <Link
                key={item.slug}
                href={`/en/trust/${item.slug}`}
                className="rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-kaffza-primary text-sm font-extrabold">{item.title}</div>
                <div className="text-kaffza-text/80 mt-2 text-sm leading-6">{item.summary}</div>
                <ul className="text-kaffza-text/70 mt-3 space-y-1 text-xs">
                  {item.points.slice(0, 2).map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link className="text-kaffza-primary text-sm font-bold underline" href="/en/trust">
              View all Trust & Safety pages
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
                Oman e-commerce platform — Ship or die.
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link className="text-kaffza-primary font-bold underline" href="/en/legal/privacy">
                Privacy Policy
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/en/legal/terms">
                Terms & Conditions
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/en/features">
                Features
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/en/pricing">
                Pricing
              </Link>
              <Link className="text-kaffza-primary font-bold underline" href="/en/contact">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="text-kaffza-text/60 mt-8 text-xs">
            © 2025 Jawaharat Al Shahba Modern LLC
          </div>
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

export default function EnLandingPage() {
  return (
    <Suspense>
      <EnLandingPageInner />
    </Suspense>
  );
}
