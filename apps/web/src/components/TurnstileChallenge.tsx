'use client';

import { useEffect, useRef } from 'react';

type TurnstileProps = {
  onToken: (token: string) => void;
  isEn?: boolean;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileChallenge({ onToken, isEn = false }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let widgetId: string | null = null;
    let disposed = false;

    const renderWidget = () => {
      if (disposed || !window.turnstile || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        language: isEn ? 'en' : 'auto',
        theme: 'light',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return () => {
        disposed = true;
        if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      };
    }

    let script = document.querySelector(
      'script[data-kaffza-turnstile]'
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-kaffza-turnstile', '1');
      document.head.appendChild(script);
    }

    const onLoad = () => renderWidget();
    const onError = () => onToken('');
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    return () => {
      disposed = true;
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [isEn, onToken, siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
