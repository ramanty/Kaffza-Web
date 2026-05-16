'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setMsg({ type: 'error', text: 'يرجى إدخال الاسم والرسالة على الأقل.' });
      return;
    }

    setSending(true);
    setMsg(null);

    try {
      // Send to API or email service
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMsg({ type: 'success', text: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' });
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        // Fallback: open mailto
        const subject = encodeURIComponent(`رسالة من ${form.name} عبر موقع Kaffza`);
        const body = encodeURIComponent(
          `الاسم: ${form.name}\nالهاتف: ${form.phone || 'غير محدد'}\nالبريد: ${form.email || 'غير محدد'}\n\nالرسالة:\n${form.message}`
        );
        window.open(`mailto:mn74684@gmail.com?subject=${subject}&body=${body}`, '_blank');
        setMsg({ type: 'success', text: 'تم فتح تطبيق البريد لإرسال رسالتك.' });
      }
    } catch {
      // Fallback to mailto
      const subject = encodeURIComponent(`رسالة من ${form.name} عبر موقع Kaffza`);
      const body = encodeURIComponent(
        `الاسم: ${form.name}\nالهاتف: ${form.phone || 'غير محدد'}\nالبريد: ${form.email || 'غير محدد'}\n\nالرسالة:\n${form.message}`
      );
      window.open(`mailto:mn74684@gmail.com?subject=${subject}&body=${body}`, '_blank');
      setMsg({ type: 'success', text: 'تم فتح تطبيق البريد لإرسال رسالتك.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">تواصل معنا</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">
        فريق Kaffza جاهز للمساعدة في إطلاق متجرك أو حل أي مشكلة تشغيلية.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Contact Form */}
        <Card className="p-6 lg:col-span-2">
          <div className="text-kaffza-primary text-lg font-extrabold">أرسل لنا رسالة</div>
          <p className="mt-1 text-sm text-kaffza-text/70">
            سنرد عليك في أقرب وقت ممكن خلال ساعات العمل.
          </p>

          {msg && (
            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                msg.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-bold text-kaffza-text">الاسم الكامل *</span>
                <Input
                  value={form.name}
                  onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                  placeholder="محمد العماني"
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-bold text-kaffza-text">رقم الهاتف</span>
                <Input
                  value={form.phone}
                  onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
                  placeholder="96877509646+"
                  type="tel"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-bold text-kaffza-text">البريد الإلكتروني</span>
              <Input
                value={form.email}
                onChange={(e: any) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                type="email"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-bold text-kaffza-text">الرسالة *</span>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="اكتب رسالتك هنا..."
                required
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-kaffza-primary"
              />
            </label>

            <Button type="submit" disabled={sending} className="w-full sm:w-auto">
              {sending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </Button>
          </form>
        </Card>

        {/* Contact Info */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-kaffza-primary text-sm font-extrabold">WhatsApp</div>
            <p className="mt-1 text-xs text-kaffza-text/70">الطريقة الأسرع للتواصل</p>
            <a
              href="https://wa.me/96877509646"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-600"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              راسلنا على WhatsApp
            </a>
          </Card>

          <Card className="p-5">
            <div className="text-kaffza-primary text-sm font-extrabold">الدعم الفني</div>
            <p className="mt-1 text-xs text-kaffza-text/70">
              للاستفسارات التقنية ومشاكل الدفع
            </p>
            <a
              href="mailto:mn74684@gmail.com"
              className="mt-3 block text-sm font-bold text-kaffza-primary underline"
            >
              mn74684@gmail.com
            </a>
          </Card>

          <Card className="p-5">
            <div className="text-kaffza-primary text-sm font-extrabold">الهاتف</div>
            <p className="mt-1 text-xs text-kaffza-text/70">متاح خلال ساعات العمل</p>
            <a
              href="tel:+96877509646"
              className="mt-3 block text-sm font-bold text-kaffza-primary underline"
              dir="ltr"
            >
              +968 7750 9646
            </a>
          </Card>

          <Card className="p-5">
            <div className="text-kaffza-primary text-sm font-extrabold">ساعات العمل</div>
            <div className="mt-2 space-y-1 text-xs text-kaffza-text/80">
              <div className="flex justify-between">
                <span>الأحد - الخميس</span>
                <span className="font-bold">9:00 ص - 6:00 م</span>
              </div>
              <div className="flex justify-between">
                <span>الجمعة - السبت</span>
                <span className="font-bold text-kaffza-text/50">مغلق</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-kaffza-primary text-sm font-extrabold">العنوان</div>
            <p className="mt-2 text-xs text-kaffza-text/80 leading-5">
              جوهرة الشهباء الحديثة ش.م.م
              <br />
              المعبيلة الجنوبية، السيب
              <br />
              مسقط، سلطنة عُمان
            </p>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/merchant/register">
          <Button>سجّل كتاجر</Button>
        </Link>
        <Link href="/store">
          <Button variant="secondary">استكشف المتاجر</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary">الأسعار والخطط</Button>
        </Link>
      </div>
    </main>
  );
}
