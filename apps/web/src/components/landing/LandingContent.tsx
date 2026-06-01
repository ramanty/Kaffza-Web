"use client";

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Globe, Rocket, Shield, Zap } from 'lucide-react';
import * as motion from 'framer-motion/client';
import Hero3D from '@/components/landing/Hero3D';
import { SiteTopBar } from '@/components/SiteTopBar';
import { cn } from '@/lib/utils';

export default function LandingPageAr() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Glowing Orbs for Glassmorphism Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none z-0" />

      <SiteTopBar />

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative flex min-h-[90vh] items-center justify-center pt-20">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center lg:text-right relative z-20"
            >
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                أطلق متجرك الإلكتروني
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  خلال دقائق معدودة
                </span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto lg:mx-0">
                منصة التجارة الإلكترونية الأسهل والأكثر تطوراً. صمم متجرك، استقبل المدفوعات، وابدأ البيع لعملائك في عُمان والعالم بسلاسة.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:scale-105"
                >
                  ابدأ مجاناً
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/50 backdrop-blur-md px-8 py-4 text-sm font-bold transition-all hover:bg-muted"
                >
                  اكتشف الباقات
                </Link>
              </div>
            </motion.div>

            {/* 3D Hero Component */}
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] w-full z-10">
              <Hero3D />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold sm:text-4xl">لماذا تختار منصة قفزة؟</h2>
              <p className="mt-4 text-muted-foreground">كل ما تحتاجه لإدارة تجارتك باحترافية</p>
            </motion.div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Zap className="h-6 w-6 text-yellow-500" />,
                  title: 'سرعة البرق',
                  desc: 'متاجر سريعة التحميل لضمان أفضل تجربة تسوق لعملائك.',
                },
                {
                  icon: <Shield className="h-6 w-6 text-green-500" />,
                  title: 'أمان وحماية',
                  desc: 'بنية تحتية مشفرة ومحمية ضد الهجمات والاختراقات.',
                },
                {
                  icon: <Globe className="h-6 w-6 text-blue-500" />,
                  title: 'دومين مخصص',
                  desc: 'اربط متجرك بنطاقك الخاص لتعزيز علامتك التجارية.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-6 hover:bg-card/60 transition-colors"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-muted p-3">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
