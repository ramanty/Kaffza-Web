"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("@/components/landing/Hero3D"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      {/* Glowing Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] -z-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] -z-20 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48 flex flex-col md:flex-row items-center">
        <Hero3D />
        
        <div className="md:w-1/2 flex flex-col items-start text-right z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              التجارة الإلكترونية، <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                أُعيد ابتكارها.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              منصة قفزة تمنحك كل ما تحتاجه لإطلاق متجرك الإلكتروني، إدارة النزاعات، واستقبال المدفوعات بسهولة وأمان.
            </p>
            <div className="flex gap-4">
              <Link
                href="/merchant/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
              >
                ابدأ مجاناً الآن
              </Link>
              <Link
                href="/pricing"
                className="bg-accent text-accent-foreground hover:bg-muted font-bold py-3 px-8 rounded-full border border-border transition-all hover:scale-105"
              >
                اكتشف الباقات
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
