import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
});

// Automatically attach JWT from cookies on every request (client-side only).
// Matches the same cookie candidates used in lib/auth.ts and middleware.ts.
const TOKEN_COOKIE_CANDIDATES = ['kaffza_access', 'accessToken', 'access_token', 'token'];

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && document.cookie) {
    const cookieMap = new Map<string, string>();
    for (const part of document.cookie.split(';')) {
      const idx = part.trim().indexOf('=');
      if (idx === -1) continue;
      cookieMap.set(
        decodeURIComponent(part.trim().slice(0, idx)),
        decodeURIComponent(part.trim().slice(idx + 1))
      );
    }
    for (const name of TOKEN_COOKIE_CANDIDATES) {
      const token = cookieMap.get(name);
      if (token && token.trim()) {
        if (!config.headers.get('Authorization')) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
        break;
      }
    }
  }
  return config;
});
