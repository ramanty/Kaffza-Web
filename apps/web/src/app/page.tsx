"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShieldCheck, Zap, Globe2 } from "lucide-react";

const Hero3D = dynamic(() => import("@/components/landing/Hero3D"), { ssr: false });

const fadeUpParams = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05050f] text-white relative flex flex-col items-center selection:bg-blue-500/30">
      
      {/* Nebula Dark Tech Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-center bg-cover bg-no-repeat mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#1a1a2e_0%,transparent_80%)]" />

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48 flex flex-col md:flex-row items-center min-h-[90vh]">
        <Hero3D />
        
        <div className="md:w-1/2 flex flex-col items-start text-right">
          <motion.div {...fadeUpParams}>
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium text-sm backdrop-blur-md">
              الجيل القادم من التجارة الإلكترونية
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              تجاربك الرقمية، <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                أُعيد ابتكارها.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg leading-relaxed">
              منصة قفزة تمنحك كل ما تحتاجه لإطلاق متجرك الإلكتروني، إدارة النزاعات، واستقبال المدفوعات بسهولة وأمان فائق في دقائق معدودة.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/merchant/login"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
              >
                ابدأ مجاناً الآن
              </Link>
              <Link
                href="/pricing"
                className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full border border-white/10 transition-all backdrop-blur-sm"
              >
                اكتشف الباقات
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 w-full bg-black/40 border-y border-white/5 backdrop-blur-xl py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-16" {...fadeUpParams}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">سرعة لا تُضاهى، أمان مطلق</h2>
            <p className="text-slate-400 text-lg">بنيت قفزة بأحدث التقنيات لضمان أداء استثنائي لمتجرك.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 text-right">
            {[
              { icon: Zap, title: "سرعة البرق", desc: "أداء استثنائي بفضل بنية Edge Computing المتقدمة التي تضمن تحميل متجرك في أجزاء من الثانية." },
              { icon: ShieldCheck, title: "حماية متطورة", desc: "نظام ضمان مالي (Escrow) يحمي حقوق التاجر والعميل مع تشفير بنكي لكافة البيانات." },
              { icon: Globe2, title: "توسع عالمي", desc: "ادعم أسواقاً متعددة وبوابات دفع عالمية بنقرة واحدة، مع بنية تحتية سحابية تتوسع تلقائياً." }
            ].map((Feature, i) => (
              <motion.div 
                key={i}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
                  <Feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{Feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{Feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32">
        <motion.div className="text-center mb-20" {...fadeUpParams}>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">كيف تعمل منصة قفزة؟</h2>
          <p className="text-slate-400 text-lg">ثلاث خطوات بسيطة تفصلك عن الانطلاق في عالم التجارة.</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 text-center relative">
          {/* Decorative Line */}
          <div className="hidden md:block absolute top-12 right-[15%] left-[15%] h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent -z-10" />

          {[
            { step: "01", title: "أنشئ حسابك", desc: "سجل مجاناً في ثوانٍ وابدأ بتخصيص مظهر متجرك." },
            { step: "02", title: "أضف منتجاتك", desc: "ارفع منتجاتك، حدد الأسعار، واربط بوابة الدفع بنقرة واحدة." },
            { step: "03", title: "استقبل الطلبات", desc: "انطلق! وابدأ في تحقيق المبيعات وإدارة شحناتك بسهولة." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="flex-1 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              <div className="w-24 h-24 rounded-full bg-black border-2 border-blue-500 flex items-center justify-center text-3xl font-extrabold text-white mb-6 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
