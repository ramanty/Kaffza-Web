'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';

export default function StoreListPage() {
  const [subdomain, setSubdomain] = useState('');
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-kaffza-info">استكشف المتاجر</h1>
        <div className="flex gap-3 text-sm">
          <Link className="underline" href="/legal/terms">الشروط</Link>
          <Link className="underline" href="/legal/privacy">الخصوصية</Link>
        </div>
      </div>

      <p className="mt-2 text-kaffza-text">اكتب subdomain وانتقل للمتجر.</p>
      <Card className="mt-6 p-6">
        <div className="grid gap-3">
          <Input value={subdomain} onChange={(e:any) => setSubdomain(e.target.value)} placeholder="demo" />
          <Button className="w-full" onClick={() => { const s=subdomain.trim(); if(!s) return; window.location.href=`/store/${s}`; }}>افتح المتجر</Button>
        </div>
      </Card>
    </main>
  );
}
