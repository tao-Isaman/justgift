import type { Metadata } from "next";
import { Anuphan, Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SEO_KEYWORDS } from "@/lib/constants";

const anuphan = Anuphan({
  subsets: ["latin", "thai"],
  variable: "--font-anuphan",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://justgift.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JustGift — ระบบโดเนทสำหรับสตรีมเมอร์ รับโดเนทพร้อมเพย์",
    template: "%s · JustGift",
  },
  description:
    "JustGift ระบบโดเนทสำหรับสตรีมเมอร์ รับโดเนทผ่านพร้อมเพย์และทุกธนาคาร ตรวจสลิปอัตโนมัติ แจ้งเตือนโดเนทขึ้นจอสตรีมทันที เงินเข้าบัญชีคุณโดยตรง ไม่หักค่าธรรมเนียม",
  keywords: SEO_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    title: "JustGift — ระบบโดเนทสำหรับสตรีมเมอร์ รับโดเนทพร้อมเพย์",
    description:
      "รับโดเนทผ่านพร้อมเพย์ ตรวจสลิปอัตโนมัติ แจ้งเตือนโดเนทขึ้นจอสตรีมทันที เงินเข้าบัญชีคุณโดยตรง",
    url: siteUrl,
    siteName: "JustGift",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JustGift — ระบบโดเนทสำหรับสตรีมเมอร์ โดเนทพร้อมเพย์",
    description:
      "ระบบโดเนทสำหรับสตรีมเมอร์ รับโดเนทพร้อมเพย์ ตรวจสลิปอัตโนมัติ แจ้งเตือนขึ้นจอทันที",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${rajdhani.variable} ${orbitron.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  );
}
