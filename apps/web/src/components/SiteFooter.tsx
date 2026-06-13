import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter({ lang = "ar" }: { lang?: "ar" | "en" }) {
  const isAr = lang === "ar";
  
  const companyLinks = isAr
    ? [{ label: "الثقة والأمان", href: "/trust" }, { label: "الخطط", href: "/plans" }, { label: "للتجّار", href: "/merchant/register" }, { label: "المتاجر", href: "/store" }]
    : [{ label: "Trust & Safety", href: "/en/trust" }, { label: "Plans", href: "/en/plans" }, { label: "For Merchants", href: "/en/merchant/register" }, { label: "Stores", href: "/store" }];
    
  const productLinks = isAr
    ? [{ label: "المميزات", href: "/features" }, { label: "الأسعار", href: "/pricing" }, { label: "مركز المساعدة", href: "/help" }, { label: "تواصل معنا", href: "/contact" }]
    : [{ label: "Features", href: "/en/features" }, { label: "Pricing", href: "/en/pricing" }, { label: "Help Center", href: "/en/help" }, { label: "Contact Us", href: "/en/contact" }];
    
  const supportLinks = isAr
    ? [{ label: "مركز المساعدة", href: "/help" }, { label: "تواصل معنا", href: "/contact" }, { label: "شروط الخدمة", href: "/legal/terms" }, { label: "سياسة الخصوصية", href: "/legal/privacy" }]
    : [{ label: "Help Center", href: "/en/help" }, { label: "Contact Us", href: "/en/contact" }, { label: "Terms of Service", href: "/en/legal/terms" }, { label: "Privacy Policy", href: "/en/legal/privacy" }];

  const realAddress = isAr 
    ? "المعبيلة الجنوبية، السيب، مسقط، سلطنة عُمان" 
    : "Al Mabelah Al Janubiyah, Seeb, Muscat, Sultanate of Oman";
  const realPhone = "+968 7750 9646";
  const realEmail = "support@kaffza.com";

  return (
    <footer className="bg-[#02020a] border-t border-slate-800 text-slate-300 relative z-20" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & Info */}
          <div className="space-y-6">
            <Link href={isAr ? "/" : "/en"} className="inline-block">
              <span className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl w-10 h-10 flex items-center justify-center text-white shadow-lg">K</span>
                Kaffza
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {isAr 
                ? "منصة قفزة هي الحل المتكامل لإطلاق متجرك الإلكتروني وإدارته بنجاح. نوفر لك أفضل أدوات الدفع والحماية لتنمية أعمالك."
                : "Kaffza is the all-in-one platform to launch and manage your e-commerce store successfully. We provide the best payment and security tools to grow your business."}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">{isAr ? "الشركة" : "Company"}</h3>
            <ul className="space-y-4">
              {companyLinks.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500/0 hover:bg-blue-500 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">{isAr ? "المنتجات" : "Products"}</h3>
            <ul className="space-y-4">
              {productLinks.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500/0 hover:bg-blue-500 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info - FIXED with real Oman details */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">{isAr ? "تواصل معنا" : "Contact Us"}</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>{realAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <span dir="ltr">{realPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <a href={"mailto:" + realEmail} className="hover:text-blue-400 transition-colors">{realEmail}</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Kaffza Al-Nahda Technologies L.L.C. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-slate-300">{isAr ? "الشروط" : "Terms"}</Link>
            <Link href="/legal/privacy" className="hover:text-slate-300">{isAr ? "الخصوصية" : "Privacy"}</Link>
            <Link href="/cookies" className="hover:text-slate-300">{isAr ? "الكوكيز" : "Cookies"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
