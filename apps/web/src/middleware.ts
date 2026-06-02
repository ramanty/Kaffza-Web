import { NextRequest, NextResponse } from 'next/server';

const DASH_PREFIX = '/dashboard';
const ACCOUNT_PREFIX = '/account';
const ADMIN_PREFIX = '/admin';
const ONBOARDING_PATH = '/onboarding';

const TOKEN_COOKIE_CANDIDATES = ['kaffza_access'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function base64UrlToBase64(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  return base64 + (pad ? '='.repeat(4 - pad) : '');
}

function base64UrlToString(base64Url: string) {
  const base64 = base64UrlToBase64(base64Url);
  return atob(base64);
}

function base64UrlToUint8Array(base64Url: string) {
  const str = base64UrlToString(base64Url);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = base64UrlToString(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function verifyHs256(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [h, p, s] = parts;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const data = enc.encode(`${h}.${p}`);
    const sig = base64UrlToUint8Array(s);

    return await crypto.subtle.verify('HMAC', key, sig, data);
  } catch {
    return false;
  }
}

function getToken(req: NextRequest) {
  for (const name of TOKEN_COOKIE_CANDIDATES) {
    const v = req.cookies.get(name)?.value;
    if (v && v.trim()) return v;
  }
  return null;
}

function redirect(req: NextRequest, to: string, nextPath?: string) {
  const url = req.nextUrl.clone();
  url.pathname = to;
  if (nextPath) url.searchParams.set('next', nextPath);
  return NextResponse.redirect(url);
}

async function hasStores(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stores/my`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'x-client': 'web' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    const arr = data?.data;
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return true; // fail-open to avoid blocking
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const currentHost = hostname.replace(/:\d+$/, '');
  const isKaffzaMain = currentHost === 'kaffza.me' || currentHost === 'www.kaffza.me' || currentHost === 'localhost' || currentHost === 'shops.kaffza.me';

  if (!isKaffzaMain) {
    let slug = currentHost;
    if (currentHost.endsWith('.kaffza.me')) {
      slug = currentHost.replace('.kaffza.me', '');
    } else if (currentHost.endsWith('.localhost')) {
      slug = currentHost.replace('.localhost', '');
    }

    // Skip API or static paths safely at the edge
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
      return NextResponse.next();
    }

    const localeMatch = pathname.match(/^\/(en|ar)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'ar';
    const pathWithoutLocale = localeMatch ? pathname.replace(`/${locale}`, '') : pathname;
    const finalPath = pathWithoutLocale === '' ? '/' : pathWithoutLocale;

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/storefront/${slug}${finalPath}`;
    return NextResponse.rewrite(url);
  }

  const isEn = req.nextUrl.searchParams.get('lang') === 'en';
  const merchantLoginPath = isEn ? '/en/merchant/login' : '/merchant/login';
  const customerLoginPath = isEn ? '/en/login' : '/login';
  const homePath = isEn ? '/en' : '/';

  const isDash = pathname.startsWith(DASH_PREFIX);
  const isAccount = pathname.startsWith(ACCOUNT_PREFIX);
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isOnboarding = pathname === ONBOARDING_PATH || pathname.startsWith(ONBOARDING_PATH + '/');

  if (!isDash && !isAccount && !isAdmin && !isOnboarding) return NextResponse.next();

  const token = getToken(req);
  if (!token) {
    if (isAdmin) return redirect(req, customerLoginPath, pathname);
    if (isAccount) return redirect(req, customerLoginPath, pathname);
    return redirect(req, merchantLoginPath, pathname);
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    if (isAdmin) return redirect(req, customerLoginPath, pathname);
    if (isAccount) return redirect(req, customerLoginPath, pathname);
    return redirect(req, merchantLoginPath, pathname);
  }

  if (payload?.exp && Date.now() >= Number(payload.exp) * 1000) {
    if (isAdmin) return redirect(req, customerLoginPath, pathname);
    if (isAccount) return redirect(req, customerLoginPath, pathname);
    return redirect(req, merchantLoginPath, pathname);
  }

  const secret = process.env.JWT_SECRET;
  if (secret) {
    const ok = await verifyHs256(token, secret);
    if (!ok) {
      if (isAdmin) return redirect(req, customerLoginPath, pathname);
      if (isAccount) return redirect(req, customerLoginPath, pathname);
      return redirect(req, merchantLoginPath, pathname);
    }
  }

  const role = String(payload?.role || '').toLowerCase();
  const hasStore = payload?.hasStore === true;

  if (isAdmin) {
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = homePath;
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  if (isDash) {
    if (!token || !payload) return redirect(req, merchantLoginPath, pathname);
    if (role === 'customer' && !hasStore) return redirect(req, '/onboarding');
  }

  if (isOnboarding) {
    if (!token || !payload) return redirect(req, merchantLoginPath, pathname);
    if (hasStore) return redirect(req, '/dashboard');
  }

  if (isAccount) {
    if (!token || !payload) return redirect(req, customerLoginPath, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
