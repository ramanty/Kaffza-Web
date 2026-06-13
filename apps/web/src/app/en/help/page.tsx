import Link from "next/link";
import { Card } from "../../../components/Card";

export default function EnHelpPage() {
  return (
    <main dir="ltr" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">Help Center</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en">Home</Link>
      </div>
      <p className="text-foreground/80 mt-3 text-sm">
        Quick answers to common questions and direct ways to reach the Kaffza team.
      </p>
      <div className="mt-8 grid gap-4">
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">How do I launch my store?</div>
          <div className="text-foreground/80 mt-2 text-sm">
            Register as a merchant, pick a plan, add your products, connect Thawani Pay and Jeena shipping. Your store is live instantly.
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">How are payments protected?</div>
          <div className="text-foreground/80 mt-2 text-sm">
            We use an Escrow system: funds are held until the customer confirms receipt. Disputes are resolved within 7 business days.
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">What payment and shipping methods are supported?</div>
          <div className="text-foreground/80 mt-2 text-sm">
            Payments: Thawani + COD + Wallet + BNPL. Shipping: Jeena (Jina com) inside Oman.
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-primary text-lg font-extrabold">I need technical support or subscription help</div>
          <div className="text-foreground/80 mt-2 text-sm">Contact us directly:</div>
          <div className="mt-3 space-y-1 text-sm">
            <div>Technical Support: <a className="text-primary font-bold underline" href="mailto:support@kaffza.com">support@kaffza.com</a></div>
            <div>Sales and Subscriptions: <a className="text-primary font-bold underline" href="mailto:sales@kaffza.com">sales@kaffza.com</a></div>
            <div>Phone: <span dir="ltr">+968 7750 9646</span></div>
            <div>Address: Al Mabelah Al Janubiyah, Seeb, Muscat, Sultanate of Oman</div>
          </div>
        </Card>
      </div>
      <div className="mt-8">
        <Link href="/en/contact" className="text-primary font-bold underline">Full contact page</Link>
      </div>
    </main>
  );
}
