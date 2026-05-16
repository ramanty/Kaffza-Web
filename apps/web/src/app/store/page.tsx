'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { api } from '../../lib/api';

type Store = {
  id: string;
  subdomain: string;
  nameAr?: string;
  nameEn?: string;
  logoUrl?: string;
  description?: string;
};

export default function StoreListPage() {
  const [subdomain, setSubdomain] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stores?limit=50&isActive=true');
      const list = res?.data?.data || [];
      setStores(list.map((s: any) => ({
        id: String(s.id),
        subdomain: s.subdomain,
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        logoUrl: s.logoUrl,
        description: s.descriptionAr || s.descriptionEn || '',
      })));
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const filteredStores = stores.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.subdomain.toLowerCase().includes(term) ||
      s.nameAr?.toLowerCase().includes(term) ||
      s.nameEn?.toLowerCase().includes(term)
    );
  });

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-kaffza-info">استكشف المتاجر</h1>
          <p className="mt-1 text-sm text-kaffza-text/70">
            تصفح المتاجر المتاحة على منصة Kaffza أو ادخل رابط المتجر مباشرة.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link className="text-kaffza-primary underline" href="/legal/terms">الشروط</Link>
          <Link className="text-kaffza-primary underline" href="/legal/privacy">الخصوصية</Link>
          <Link className="text-kaffza-primary underline" href="/">الرئيسية</Link>
        </div>
      </div>

      {/* Quick access */}
      <Card className="mt-6 p-5">
        <div className="text-sm font-extrabold text-kaffza-primary">وصول سريع</div>
        <p className="mt-1 text-xs text-kaffza-text/70">
          اكتب subdomain المتجر للانتقال إليه مباشرة.
        </p>
        <div className="mt-3 flex gap-3">
          <Input 
            value={subdomain} 
            onChange={(e: any) => setSubdomain(e.target.value)} 
            placeholder="مثال: demo" 
            className="flex-1"
          />
          <Button 
            onClick={() => { 
              const s = subdomain.trim(); 
              if (!s) return; 
              window.location.href = `/store/${s}`; 
            }}
          >
            افتح المتجر
          </Button>
        </div>
      </Card>

      {/* Search */}
      <div className="mt-6">
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن متجر بالاسم..."
          className="w-full max-w-md"
        />
      </div>

      {/* Stores grid */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-kaffza-bg p-6">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
              </Card>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-lg font-extrabold text-kaffza-primary">لا توجد متاجر</div>
            <p className="mt-2 text-sm text-kaffza-text/70">
              {searchTerm ? 'لم يتم العثور على متاجر تطابق بحثك.' : 'لا توجد متاجر نشطة حالياً.'}
            </p>
            <div className="mt-4">
              <Link href="/merchant/register">
                <Button>أنشئ متجرك الآن</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStores.map((store) => (
              <Link key={store.id} href={`/store/${store.subdomain}`}>
                <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-kaffza-bg">
                      {store.logoUrl ? (
                        <img 
                          src={store.logoUrl} 
                          alt={store.nameAr || store.nameEn || 'logo'} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <span className="text-lg font-extrabold text-kaffza-primary">
                          {(store.nameAr || store.nameEn || store.subdomain).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-extrabold text-kaffza-info">
                        {store.nameAr || store.nameEn || store.subdomain}
                      </div>
                      <div className="mt-1 text-xs text-kaffza-text/60">
                        kaffza.me/store/{store.subdomain}
                      </div>
                    </div>
                  </div>
                  {store.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-kaffza-text/70">
                      {store.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      نشط
                    </span>
                    <span className="text-xs font-bold text-kaffza-primary">
                      زيارة المتجر &larr;
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Card className="mt-10 bg-gradient-to-l from-kaffza-primary to-kaffza-info p-8 text-white">
        <div className="text-2xl font-extrabold">هل أنت تاجر؟</div>
        <p className="mt-2 text-sm text-white/80">
          أنشئ متجرك الإلكتروني مجاناً على منصة Kaffza وابدأ البيع في عُمان خلال 10 دقائق.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/merchant/register">
            <Button className="border border-white/60 bg-white !text-kaffza-primary hover:bg-slate-100">
              سجّل كتاجر مجاناً
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary" className="border-white/40 bg-white/10 !text-white hover:bg-white/20">
              تعرف على الأسعار
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
