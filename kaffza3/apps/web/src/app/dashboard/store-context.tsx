'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { authHeader } from '../../lib/auth';

export type StoreItem = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  subdomain?: string;
};

type StoreState = {
  stores: StoreItem[];
  storeId: string | null;
  setStoreId: (id: string) => void;
  loading: boolean;
  reload: () => Promise<void>;
};

const StoreCtx = createContext<StoreState | null>(null);
const STORE_COOKIE = 'kaffza_store';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie || '';
  const parts = raw.split(';').map((p) => p.trim());
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    const k = decodeURIComponent(p.slice(0, idx));
    if (k !== name) continue;
    return decodeURIComponent(p.slice(idx + 1));
  }
  return null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

export function clearStoreCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'kaffza_store=; Path=/; Max-Age=0; SameSite=Lax';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const res = await api.get('/stores/my', { headers: { ...authHeader(), 'x-client': 'web' } });
      const data: any[] = res?.data?.data || [];
      const list = data.map((s) => ({
        id: String(s.id),
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        subdomain: s.subdomain,
      }));
      setStores(list);

      const saved = readCookie(STORE_COOKIE);
      const validSaved = saved && list.some((x) => x.id === saved) ? saved : null;
      const nextId = validSaved || list[0]?.id || null;
      setStoreIdState(nextId);
      if (nextId) writeCookie(STORE_COOKIE, nextId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStoreId = (id: string) => {
    setStoreIdState(id);
    writeCookie(STORE_COOKIE, id);
  };

  const value = useMemo<StoreState>(() => ({ stores, storeId, setStoreId, loading, reload }), [stores, storeId, loading]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
