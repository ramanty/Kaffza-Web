import Link from 'next/link';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function EnHome() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12" dir="ltr">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-extrabold text-kaffza-info">Kaffza</div>
        <div className="flex gap-2">
          <Link href="/store"><Button variant="premium">Browse Stores</Button></Link>
          <Link href="/"><Button variant="secondary">العربية</Button></Link>
        </div>
      </div>

      <Card className="mt-8 p-6">
        <div className="text-lg font-extrabold text-kaffza-info">UAT Ready</div>
        <div className="mt-2 text-sm text-kaffza-text">Open /store and enter a store subdomain.</div>
      </Card>

      <footer className="mt-12 text-sm text-kaffza-text">
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href="/en/legal/terms">Terms & Conditions</Link>
          <Link className="underline" href="/en/legal/privacy">Privacy Policy</Link>
          <Link className="underline" href="/legal/terms">الشروط</Link>
          <Link className="underline" href="/legal/privacy">الخصوصية</Link>
        </div>
      </footer>
    </main>
  );
}
