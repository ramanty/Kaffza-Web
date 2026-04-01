import { Card } from './Card';

export default function LegalPage({ title, text, lang = 'ar' }: { title: string; text: string; lang?: 'ar' | 'en' }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <main className="mx-auto max-w-4xl px-6 py-10" dir={dir}>
      <Card className="p-8">
        <h1 className="text-2xl font-extrabold text-kaffza-info">{title}</h1>
        <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-kaffza-text">{text}</pre>
      </Card>
    </main>
  );
}
