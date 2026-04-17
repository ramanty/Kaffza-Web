import Link from 'next/link';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function EnHome() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12" dir="ltr">
      <div className="flex items-center justify-between gap-3">
        <a
          href="https://kaffza.me"
          className="text-kaffza-info text-2xl font-extrabold transition hover:opacity-80"
        >
          Kaffza
        </a>
        <div className="flex flex-wrap gap-2">
          <Link href="/en/features">
            <Button variant="secondary">Features</Button>
          </Link>
          <Link href="/en/plans">
            <Button variant="secondary">Plans</Button>
          </Link>
          <Link href="/en/contact">
            <Button variant="secondary">Contact</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">العربية</Button>
          </Link>
        </div>
      </div>

      <Card className="mt-8 p-6">
        <div className="text-kaffza-info text-lg font-extrabold">Launch your store in minutes</div>
        <div className="text-kaffza-text mt-2 text-sm">
          Kaffza gives you a ready storefront, local payments, and trust-first flows for Oman.
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/merchant/register">
            <Button>Register as merchant</Button>
          </Link>
          <Link href="/en/plans">
            <Button variant="secondary">Compare plans</Button>
          </Link>
        </div>
      </Card>

      <footer className="text-kaffza-text mt-12 text-sm">
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href="/en/features">
            Features
          </Link>
          <Link className="underline" href="/en/plans">
            Plans
          </Link>
          <Link className="underline" href="/en/trust">
            Trust & Safety
          </Link>
          <Link className="underline" href="/en/contact">
            Contact
          </Link>
          <Link className="underline" href="/en/legal/terms">
            Terms & Conditions
          </Link>
          <Link className="underline" href="/en/legal/privacy">
            Privacy Policy
          </Link>
          <Link className="underline" href="/legal/terms">
            الشروط
          </Link>
          <Link className="underline" href="/legal/privacy">
            الخصوصية
          </Link>
        </div>
      </footer>
    </main>
  );
}
