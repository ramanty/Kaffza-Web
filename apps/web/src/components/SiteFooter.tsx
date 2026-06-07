import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export function SiteFooter({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  
  const companyLinks = isAr 
    ? [{ label: 'عن قفزة', href: '/about' }, { label: 'المدونة', href: '/blog' }, { label: 'الوظائف', href: '/careers' }, { label: 'الصحافة', href: '/press' }]
    : [{ label: 'About Kaffza', href: '/en/about' }, { label: 'Blog', href: '/en/blog' }, { label: 'Careers', href: '/en/careers' }, { label: 'Press', href: '/en/press' }];
    
  const productLinks = isAr
    ? [{ label: 'المميزات', href: '/features' }, { label: 'الأسعار', href: '/pricing' }, { label: 'بوابات الدفع', href: '/payments' }, { label: 'دليل المطورين', href: '/developers' }]
    : [{ label: 'Features', href: '/en/features' }, { label: 'Pricing', href: '/en/pricing' }, { label: 'Payment Gateways', href: '/en/payments' }, { label: 'Developers', href: '/en/developers' }];
    
  const supportLinks = isAr
    ? [{ label: 'مركز المساعدة', href: '/help' }, { label: 'تواصل معنا', href: '/contact' }, { label: 'شروط الخدمة', href: '/legal/terms' }, { label: 'سياسة الخصوصية', href: '/legal/privacy' }]
    : [{ label: 'Help Center', href: '/en/help' }, { label: 'Contact Us', href: '/en/contact' }, { label: 'Terms of Service', href: '/en/legal/terms' }, { label: 'Privacy Policy', href: '/en/legal/privacy' }];

  return (
    <footer className="bg-[#02020a] border-t border-slate-800 text-slate-300 relative z-20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & Info */}
          <div className="space-y-6">
            <Link href={isAr ? '/' : '/en'} className="inline-block">
              <span className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl w-10 h-10 flex items-center justify-center text-white shadow-lg">K</span>
                Kaffza
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {isAr 
                ? 'منصة قفزة هي الحل المتكامل لإطلاق متجرك الإلكتروني وإدارته بنجاح. نوفر لك أفضل أدوات الدفع والحماية لتنمية أعمالك.'
                : 'Kaffza is the all-in-one platform to launch and manage your e-commerce store successfully. We provide the best payment and security tools to grow your business.'}
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
            <h3 className="text-white font-bold text-lg mb-6">{isAr ? 'الشركة' : 'Company'}</h3>
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
            <h3 className="text-white font-bold text-lg mb-6">{isAr ? 'المنتجات' : 'Products'}</h3>
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

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">{isAr ? 'تواصل معنا' : 'Contact Us'}</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>{isAr ? 'برج الابتكار، شارع المعرفة، دبي، الإمارات' : 'Innovation Tower, Knowledge St, Dubai, UAE'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <span dir="ltr">+971 4 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <a href="mailto:hello@kaffza.com" className="hover:text-blue-400 transition-colors">hello@kaffza.com</a>
              </li>
            </ul>
            <div className="mt-8">
              <Link 
                href={isAr ? '/support/new' : '/en/support/new'}
                className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"
              >
                {isAr ? 'فتح تذكرة دعم فني' : 'Open Support Ticket'}
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Kaffza Inc. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-slate-300">{isAr ? 'الشروط' : 'Terms'}</Link>
            <Link href="/legal/privacy" className="hover:text-slate-300">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
            <Link href="/cookies" className="hover:text-slate-300">{isAr ? 'الكوكيز' : 'Cookies'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
