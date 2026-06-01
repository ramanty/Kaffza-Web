'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { extractApiErrorMessage } from '../lib/api-error';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

async function ensureScript(src: string) {
  if (typeof window === 'undefined') return;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(s);
  });
}

export function SocialAuthButtons({
  locale = 'ar',
  onAuthSuccess,
  onError,
}: {
  locale?: 'ar' | 'en';
  onAuthSuccess: (accessToken: string) => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const googleLabel = locale === 'ar' ? 'المتابعة عبر Google' : 'Continue with Google';
  const appleLabel = locale === 'ar' ? 'المتابعة عبر Apple' : 'Continue with Apple';

  async function loginWithGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError(locale === 'ar' ? 'Google OAuth غير مضبوط حالياً' : 'Google OAuth is not configured');
      return;
    }

    setLoading('google');
    try {
      await ensureScript('https://accounts.google.com/gsi/client');
      if (!window.google?.accounts?.id) {
        throw new Error(locale === 'ar' ? 'تعذر تحميل Google SDK' : 'Could not load Google SDK');
      }

      await new Promise<void>((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              const idToken = response?.credential;
              if (!idToken) throw new Error('Missing Google credential');
              const res = await api.post(
                '/auth/oauth/google',
                { provider: 'google', idToken },
                { headers: { 'x-client': 'web' } }
              );
              const token = res?.data?.data?.tokens?.accessToken;
              if (!token) throw new Error('No access token received');
              onAuthSuccess(token);
              resolve();
            } catch (e: any) {
              reject(e);
            }
          },
        });
        window.google.accounts.id.prompt();
      });
    } catch (e: any) {
      onError(
        extractApiErrorMessage(e, locale === 'ar' ? 'فشل تسجيل Google' : 'Google sign-in failed')
      );
    } finally {
      setLoading(null);
    }
  }

  async function loginWithApple() {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || window.location.origin;
    if (!clientId) {
      onError(locale === 'ar' ? 'Apple OAuth غير مضبوط حالياً' : 'Apple OAuth is not configured');
      return;
    }

    setLoading('apple');
    try {
      await ensureScript(
        'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
      );
      if (!window.AppleID?.auth) {
        throw new Error(locale === 'ar' ? 'تعذر تحميل Apple SDK' : 'Could not load Apple SDK');
      }

      window.AppleID.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: redirectUri,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      if (!idToken) throw new Error('Missing Apple credential');

      const res = await api.post(
        '/auth/oauth/apple',
        { provider: 'apple', idToken },
        { headers: { 'x-client': 'web' } }
      );
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('No access token received');
      onAuthSuccess(token);
    } catch (e: any) {
      onError(
        extractApiErrorMessage(e, locale === 'ar' ? 'فشل تسجيل Apple' : 'Apple sign-in failed')
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 grid gap-2">
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={loading !== null}
        className="rounded-xl border border-border bg-card text-card-foreground px-4 py-2 text-sm font-bold text-[#1B3A6B] hover:bg-slate-50 disabled:opacity-60"
      >
        {loading === 'google'
          ? locale === 'ar'
            ? 'جارٍ فتح Google...'
            : 'Opening Google...'
          : googleLabel}
      </button>
      <button
        type="button"
        onClick={loginWithApple}
        disabled={loading !== null}
        className="rounded-xl border border-border bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/90 disabled:opacity-60"
      >
        {loading === 'apple'
          ? locale === 'ar'
            ? 'جارٍ فتح Apple...'
            : 'Opening Apple...'
          : appleLabel}
      </button>
    </div>
  );
}
