'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { extractApiErrorMessage } from '../lib/api-error';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

// Track scripts that are being loaded to avoid duplicate loads + wait correctly
const scriptPromises = new Map<string, Promise<void>>();

async function ensureScript(src: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // Return existing promise if script is already being loaded
  const existing = scriptPromises.get(src);
  if (existing) return existing;

  // Check if already fully loaded (script tag exists + google object ready)
  const alreadyLoaded = document.querySelector(`script[src="${src}"]`);
  // For GSI script, also check if google.accounts.id is available
  if (src.includes('google.com/gsi/client') && window.google?.accounts?.id) {
    return; // Already fully loaded and initialized
  }
  if (src.includes('appleid.cdn-apple.com') && window.AppleID?.auth) {
    return;
  }
  if (alreadyLoaded && !src.includes('google.com')) {
    return; // Non-Google scripts that are in the DOM are considered loaded
  }

  // Create a new promise
  const promise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(s);
  });

  scriptPromises.set(src, promise);
  return promise;
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
  const cancelledRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const googleLabel = locale === 'ar' ? 'المتابعة عبر Google' : 'Continue with Google';
  const appleLabel = locale === 'ar' ? 'المتابعة عبر Apple' : 'Continue with Apple';

  const loginWithGoogle = useCallback(async () => {
    if (cancelledRef.current) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError(locale === 'ar' ? 'Google OAuth غير مضبوط حالياً' : 'Google OAuth is not configured');
      return;
    }

    setLoading('google');
    try {
      // Load GSI script (waits for it to finish loading)
      await ensureScript('https://accounts.google.com/gsi/client');
      if (cancelledRef.current) return;

      // Verify SDK is available
      if (!window.google?.accounts?.id) {
        throw new Error(locale === 'ar' ? 'تعذر تحميل Google SDK' : 'Could not load Google SDK');
      }

      // Get credential via Google Identity Services
      const idToken = await new Promise<string>((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            const credential = response?.credential;
            if (credential) {
              resolve(credential);
            } else {
              reject(new Error(locale === 'ar' ? 'لم يتم استلام رمز Google' : 'Missing Google credential'));
            }
          },
        });

        // Trigger the One Tap / Google sign-in flow
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            reject(new Error(
              locale === 'ar'
                ? 'تعذر فتح نافذة تسجيل Google. تأكد من أن المتصفح لا يحجب النوافذ المنبثقة'
                : 'Google sign-in could not be displayed. Check popup blocker.'
            ));
          }
        });
      });

      if (cancelledRef.current) return;

      // Send credential to backend
      const res = await api.post(
        '/auth/oauth/google',
        { provider: 'google', idToken },
        { headers: { 'x-client': 'web' } }
      );
      const accessToken = res?.data?.data?.tokens?.accessToken;
      if (!accessToken) throw new Error('لم يتم استلام access token');
      if (!cancelledRef.current) {
        onAuthSuccess(accessToken);
      }
    } catch (e: any) {
      if (!cancelledRef.current) {
        onError(
          extractApiErrorMessage(
            e,
            locale === 'ar' ? 'فشل تسجيل Google' : 'Google sign-in failed'
          )
        );
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(null);
      }
    }
  }, [locale, onAuthSuccess, onError]);

  const loginWithApple = useCallback(async () => {
    if (cancelledRef.current) return;
    const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!appleClientId) {
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
        clientId: appleClientId,
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
      const accessToken = res?.data?.data?.tokens?.accessToken;
      if (!accessToken) throw new Error('No access token received');
      if (!cancelledRef.current) {
        onAuthSuccess(accessToken);
      }
    } catch (e: any) {
      if (!cancelledRef.current) {
        onError(
          extractApiErrorMessage(
            e,
            locale === 'ar' ? 'فشل تسجيل Apple' : 'Apple sign-in failed'
          )
        );
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(null);
      }
    }
  }, [locale, onAuthSuccess, onError]);

  return (
    <div className="mt-4 grid gap-3">
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={loading !== null}
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
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
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M16.365 1.43c0 2.03-1.495 3.87-3.23 4.12-.325.045-.635.045-.94 0-1.04-.575-1.89-2.31-1.89-3.92C10.305 0 11.83 0 13.565 0c.26 0 .52.02.775.05.99.285 2.025 1.25 2.025 1.38zM20.25 16.32c-1.32 2.76-3.825 6.06-6.665 6.06-1.575 0-2.375-1.065-4.475-1.065-2.09 0-3.08 1.055-4.485 1.055-2.735 0-5.18-3.18-6.635-6.06C-3.415 13.065.74 6.78 4.675 6.78c1.375 0 2.535 1.055 4.3 1.055 1.77 0 3.265-1.045 4.415-1.045 3.015 0 4.35 1.875 4.35 1.95-3.065 1.83-2.505 5.51.51 6.58z"/>
        </svg>
        {loading === 'apple'
          ? locale === 'ar'
            ? 'جارٍ فتح Apple...'
            : 'Opening Apple...'
          : appleLabel}
      </button>
    </div>
  );
}
