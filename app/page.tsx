import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bell,
  Check,
  Palette,
  Plus,
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
import { FAQ, PLANS, SITE } from "@/lib/constants";

const STEPS = [
  {
    icon: Upload,
    title: "ผู้ชมโอนเงินแล้วอัปโหลดสลิป",
    body: "แฟน ๆ โอนเข้าบัญชีคุณผ่านพร้อมเพย์หรือธนาคารใดก็ได้ แล้วอัปโหลดสลิปบนเพจรับโดเนทของคุณ",
  },
  {
    icon: ScanLine,
    title: "ระบบตรวจสลิปให้อัตโนมัติ",
    body: "JustGift ตรวจสลิปกับธนาคารผ่าน slip.rdcw.co.th ว่าจ่ายจริง ถูกบัญชี ยอดตรง และใช้ได้ครั้งเดียว",
  },
  {
    icon: Bell,
    title: "แจ้งเตือนโดเนทขึ้นจอสตรีม",
    body: "เมื่อยืนยันสำเร็จ การแจ้งเตือนจะเด้งขึ้นบน overlay ใน OBS พร้อมชื่อ ยอดเงิน และข้อความทันที",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "ตรวจจริง ไม่ใช่แค่เชื่อใจ",
    body: "ทุกสลิปถูกตรวจสอบกับธนาคาร สลิปปลอมหรือสลิปซ้ำผ่านไปไม่ได้",
  },
  {
    icon: Banknote,
    title: "เงินเข้าบัญชีคุณโดยตรง",
    body: "ผู้ชมโอนเข้าบัญชีคุณเอง ไม่มีคนกลางถือเงิน ไม่ต้องรอถอน ไม่มีการเรียกเงินคืน",
  },
  {
    icon: Radio,
    title: "Overlay เรียลไทม์บน OBS",
    body: "ลิงก์ Browser Source เดียว แจ้งเตือนเรียลไทม์บนพื้นหลังโปร่งใส วางแล้วไลฟ์ได้เลย",
  },
  {
    icon: Palette,
    title: "ปรับแต่งให้เป็นสไตล์คุณ",
    body: "เลือกสี ฟอนต์ เสียง และภาพ/GIF แจ้งเตือนให้เข้ากับช่องของคุณ",
  },
  {
    icon: Volume2,
    title: "อ่านข้อความเป็นเสียงภาษาไทย",
    body: "อ่านข้อความโดเนทออกเสียงบนสตรีม ไม่พลาดทุกการพูดถึงระหว่างเล่นเกม",
  },
  {
    icon: Zap,
    title: "รองรับทุกธนาคารและวอลเล็ต",
    body: "รองรับพร้อมเพย์และธนาคารหลักทุกแห่งในไทยตั้งแต่เริ่มใช้งาน",
  },
];

export default function LandingPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "JustGift",
      url: SITE.url,
      inLanguage: "th-TH",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "JustGift",
      applicationCategory: "WebApplication",
      operatingSystem: "Web",
      inLanguage: "th-TH",
      description:
        "ระบบโดเนทสำหรับสตรีมเมอร์ รับโดเนทพร้อมเพย์ ตรวจสลิปอัตโนมัติ แจ้งเตือนโดเนทขึ้นจอสตรีม",
      url: SITE.url,
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                สร้างมาเพื่อสตรีมเมอร์ไทย
              </Badge>
              <h1 className="font-heading text-5xl leading-[1.1] font-bold tracking-tight sm:text-6xl">
                ระบบโดเนท ที่{" "}
                <span className="text-primary text-glow">
                  ตรวจสลิปให้อัตโนมัติ
                </span>
              </h1>
              <p className="mt-6 max-w-md text-lg text-muted-foreground">
                ผู้ชมโอนเงินแล้วอัปโหลดสลิป JustGift
                ตรวจสอบกับธนาคารแล้วแจ้งเตือนโดเนทขึ้นจอสตรีมภายในไม่กี่วินาที
                เงินเข้าบัญชีคุณโดยตรง
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "glow-red h-11 px-6 text-base"
                  )}
                >
                  เริ่มใช้ฟรี <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#how"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 px-6 text-base"
                  )}
                >
                  ดูวิธีใช้งาน
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                ไม่ต้องใช้บัตรเครดิต · ไม่หักค่าธรรมเนียมจากยอดโดเนท
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
                    donorName="น้องเกมเมอร์"
                    amount={250}
                    message="สู้ ๆ นะครับ! เล่นเก่งมาก 🔥"
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
              eyebrow="วิธีใช้งาน"
              title="จากสลิปสู่การแจ้งเตือนในไม่กี่วินาที"
              subtitle="สามขั้นตอน ไม่ต้องเช็กเอง ไม่ต้องเชื่อแคปหน้าจอ"
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
              eyebrow="ฟีเจอร์"
              title="ครบทุกอย่างที่ระบบโดเนทควรมี"
              subtitle="เร็ว ตรวจสอบได้ และปรับแต่งเป็นสไตล์คุณ"
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
              eyebrow="ราคา"
              title="เริ่มฟรี อัปเกรดเมื่อโตขึ้น"
              subtitle="เราไม่หักจากยอดโดเนทของคุณ — เงินเข้าบัญชีคุณโดยตรง"
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
                    <Badge className="absolute -top-3 left-6">ยอดนิยม</Badge>
                  )}
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold">
                      {plan.price === 0 ? "ฟรี" : `฿${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        /เดือน
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
                    {plan.price === 0 ? "เริ่มเลย" : `เลือกแพ็ก${plan.name}`}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="border-b border-border/60">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <SectionHeading
              eyebrow="คำถามที่พบบ่อย"
              title="คำถามที่พบบ่อย"
              subtitle="เกี่ยวกับระบบโดเนทและการรับโดเนทพร้อมเพย์"
            />
            <div className="mt-10 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
              {FAQ.map((item) => (
                <details key={item.q} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus className="size-4 shrink-0 text-primary transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-glow" />
          <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              พร้อมรับ<span className="text-primary text-glow">โดเนท</span>
              แล้วหรือยัง?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              ตั้งค่าเพจและ overlay ได้ในไม่กี่นาที เริ่มต้นฟรีตลอดไป
            </p>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "glow-red mt-8 h-11 px-7 text-base"
              )}
            >
              สร้างเพจของคุณ <ArrowRight className="size-4" />
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
