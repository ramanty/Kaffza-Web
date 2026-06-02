import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '../components/ThemeProvider';
import { SiteTopBar } from '../components/SiteTopBar';

export const metadata: Metadata = {
  title: {
    default: "قفزة | Kaffza",
    template: "%s | قفزة"
  },
  description: "منصة قفزة تمنحك كل ما تحتاجه لإطلاق متجرك الإلكتروني في عُمان خلال 10 دقائق مع دفع ثواني وحماية Escrow.",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: "قفزة | أطلق متجرك الإلكتروني الآن",
    description: "منصة تجارة إلكترونية متكاملة مهيأة للسوق العُماني. جاهزية أسرع، تجربة دفع موثوقة، وأدوات تشغيل يومية للتاجر.",
    url: "https://kaffza.me",
    siteName: "Kaffza",
    images: [
      {
        url: "https://kaffza.me/icon.svg",
        width: 800,
        height: 600,
        alt: "Kaffza Platform Preview",
      },
    ],
    locale: "ar_OM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "قفزة | Kaffza",
    description: "أطلق متجرك الإلكتروني في عُمان خلال 10 دقائق.",
    images: ["https://kaffza.me/icon.svg"],
  },
};

import { PostHogProvider } from '../components/providers/PostHogProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden transition-colors duration-300 bg-background text-foreground antialiased min-h-screen">
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
            <SiteTopBar />
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
