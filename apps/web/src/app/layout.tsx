import './globals.css';
import type { Metadata } from 'next';

import { SiteTopBar } from '../components/SiteTopBar';

export const metadata: Metadata = {
  title: {
    default: 'Kaffza | Oman E-Commerce Platform',
    template: '%s | Kaffza',
  },
  description:
    'Kaffza is an Omani e-commerce platform for merchants to launch and manage online stores.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden">
        <SiteTopBar />
        {children}
      </body>
    </html>
  );
}
