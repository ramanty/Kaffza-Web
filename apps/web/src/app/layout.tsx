import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "../components/ThemeProvider";
import { SiteTopBar } from "../components/SiteTopBar";
import { PostHogProvider } from "../components/providers/PostHogProvider";

export const metadata: Metadata = {
  title: { default: "قفزة | Kaffza", template: "%s | قفزة" },
  description: "منصة قفزة — أول منصة تجارة إلكترونية عُمانية SaaS. أطلق متجرك في دقائق مع دفع آمن وحماية Escrow.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="overflow-x-hidden bg-midnight-void text-starlight antialiased min-h-screen font-cairo">
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
            <SiteTopBar />
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
