import Link from 'next/link';

import { Card } from '../../../components/Card';

export default function EnContactPage() {
  return (
    <main dir="ltr" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">Contact Us</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">
        The Kaffza team is ready to support your launch and operations.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-kaffza-primary text-lg font-extrabold">Technical Support</div>
          <div className="text-kaffza-text/80 mt-2 text-sm">
            For technical issues, payment errors, or store setup guidance.
          </div>
          <div className="mt-4">
            <a className="text-kaffza-primary font-bold underline" href="mailto:support@kaffza.com">
              support@kaffza.com
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-kaffza-primary text-lg font-extrabold">Sales & Subscriptions</div>
          <div className="text-kaffza-text/80 mt-2 text-sm">
            For plan selection and onboarding support.
          </div>
          <div className="mt-4">
            <a className="text-kaffza-primary font-bold underline" href="mailto:sales@kaffza.com">
              sales@kaffza.com
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
