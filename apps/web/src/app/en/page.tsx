"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("@/components/landing/Hero3D"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      {/* Premium SaaS Background: Grid + Top Glow */}
      <div className="absolute inset-0 z-[-1] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px] pointer-events-none"></div>
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48 flex flex-col md:flex-row items-center">
        <Hero3D />
        
        <div className="md:w-1/2 flex flex-col items-start text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              E-Commerce, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                Reinvented.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              Kaffza platform gives you everything you need to launch your online store, manage disputes, and receive payments easily and securely.
            </p>
            <div className="flex gap-4">
              <Link
                href="/en/merchant/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
              >
                Start Free Now
              </Link>
              <Link
                href="/en/pricing"
                className="bg-accent text-accent-foreground hover:bg-muted font-bold py-3 px-8 rounded-full border border-border transition-all hover:scale-105"
              >
                Discover Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
