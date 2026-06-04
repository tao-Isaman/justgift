import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bell,
  Check,
  Palette,
  Radio,
  ScanLine,
  ShieldCheck,
  Upload,
  Volume2,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AlertCard } from "@/components/alert-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/constants";

const STEPS = [
  {
    icon: Upload,
    title: "Donor pays & uploads slip",
    body: "Your fan transfers to your account from any Thai bank or wallet, then drops the transfer slip on your page.",
  },
  {
    icon: ScanLine,
    title: "We verify the slip",
    body: "JustGift checks the slip against the bank via slip.rdcw.co.th — real payment, right account, right amount, used once.",
  },
  {
    icon: Bell,
    title: "Alert fires on stream",
    body: "The instant it's verified, an alert animates on your OBS overlay with the name, amount and message.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified, not trusted",
    body: "Every slip is checked against the bank. Fake screenshots and reused slips don't get through.",
  },
  {
    icon: Banknote,
    title: "Money goes straight to you",
    body: "Donors pay your account directly. No middleman holding funds, no payout waiting, no chargebacks.",
  },
  {
    icon: Radio,
    title: "Instant OBS overlay",
    body: "One browser-source URL. Real-time alerts over a transparent background — drop it in and go live.",
  },
  {
    icon: Palette,
    title: "Make it yours",
    body: "Custom colors, fonts, sounds and alert GIFs that match your channel's brand.",
  },
  {
    icon: Volume2,
    title: "Thai text-to-speech",
    body: "Donation messages read aloud on stream so you never miss a shout-out mid-game.",
  },
  {
    icon: Zap,
    title: "Any bank, any wallet",
    body: "PromptPay and every major Thai bank are supported out of the box.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-grid" />
          <div className="pointer-events-none absolute inset-0 bg-glow" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
            <div className="flex flex-col items-start">
              <Badge
                variant="outline"
                className="mb-5 border-primary/40 text-primary"
              >
                <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                Built for Thai streamers
              </Badge>
              <h1 className="font-heading text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
                Donation alerts that{" "}
                <span className="text-primary text-glow">verify the slip</span>{" "}
                — automatically.
              </h1>
              <p className="mt-6 max-w-md text-lg text-muted-foreground">
                Your fans transfer and upload their slip. JustGift confirms it
                with the bank and fires an alert on your stream in seconds. Money
                goes straight to you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "glow-red h-11 px-6 text-base"
                  )}
                >
                  Start free <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#how"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 px-6 text-base"
                  )}
                >
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card. No commission on your donations.
              </p>
            </div>

            {/* live alert preview */}
            <div className="relative">
              <div className="absolute -inset-6 bg-glow" />
              <div className="relative rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="size-2.5 rounded-full bg-primary/70" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    OBS · Browser Source
                  </span>
                </div>
                <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-lg bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:24px_24px] p-6">
                  <AlertCard
                    className="animate-pulse-glow"
                    donorName="NongGamer123"
                    amount={250}
                    message="สู้ ๆ นะครับ! Keep grinding 🔥"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how" className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading
              eyebrow="How it works"
              title="From slip to alert in seconds"
              subtitle="Three steps. No manual checking, no trusting screenshots."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="relative rounded-xl border border-border/60 bg-card p-6"
                >
                  <span className="font-display absolute top-4 right-5 text-5xl font-bold text-primary/15">
                    {i + 1}
                  </span>
                  <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="size-5.5" />
                  </span>
                  <h3 className="font-heading mt-4 text-lg font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading
              eyebrow="Features"
              title="Everything an alert tool should be"
              subtitle="Fast, verified, and yours to customize."
            />
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card p-6">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="font-heading mt-4 text-base font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Pricing ---------------- */}
        <section id="pricing" className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading
              eyebrow="Pricing"
              title="Start free, upgrade when you grow"
              subtitle="We never take a cut of your donations — they go straight to your account."
            />
            <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-xl border bg-card p-6",
                    plan.featured
                      ? "border-primary/60 glow-red-sm"
                      : "border-border/60"
                  )}
                >
                  {plan.featured && (
                    <Badge className="absolute -top-3 left-6">
                      Most popular
                    </Badge>
                  )}
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold">
                      {plan.price === 0 ? "Free" : `฿${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={cn(
                      buttonVariants({
                        variant: plan.featured ? "default" : "outline",
                      }),
                      "mt-7 w-full"
                    )}
                  >
                    {plan.price === 0 ? "Get started" : `Choose ${plan.name}`}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-glow" />
          <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to get{" "}
              <span className="text-primary text-glow">gifted</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Set up your page and overlay in minutes. Free forever to start.
            </p>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "glow-red mt-8 h-11 px-7 text-base"
              )}
            >
              Create your page <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs font-medium tracking-[0.25em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
