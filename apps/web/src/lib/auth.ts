// Client-side helpers for reading access token from cookies.
// Note: middleware runs on server/edge, so the access token MUST be set as a cookie.

const CANDIDATES = ['kaffza_access'];

export function getAccessTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie || '';
  const parts = raw.split(';').map((p) => p.trim());
  const map = new Map<string, string>();
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    const k = decodeURIComponent(p.slice(0, idx));
    const v = decodeURIComponent(p.slice(idx + 1));
    map.set(k, v);
  }
  for (const name of CANDIDATES) {
    const v = map.get(name);
    if (v && v.trim()) return v;
  }
  return null;
}

export function authHeader(): Record<string, string> {
  const t = getAccessTokenFromCookies();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function clearAuthCookiesClientSide() {
  // H-08: HttpOnly cookies can't be deleted by JS, so we call the backend API to clear them properly.
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/logout`,
      {
        method: 'POST',
        headers: authHeader(),
      }
    );
  } catch {
    // Ignore error, best effort
  }
}
