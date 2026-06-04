import type { Metadata } from "next";
import { Anuphan, Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
    default: "JustGift — Donation Alerts for Streamers",
    template: "%s · JustGift",
  },
  description:
    "Verified donation alerts for Thai streamers. Donors transfer and upload a slip, we verify it instantly and fire an on-stream alert.",
  keywords: [
    "donation alert",
    "streamer",
    "OBS",
    "PromptPay",
    "slip verification",
    "JustGift",
  ],
  openGraph: {
    title: "JustGift — Donation Alerts for Streamers",
    description:
      "Verified donation alerts for Thai streamers. Slip in, alert out.",
    url: siteUrl,
    siteName: "JustGift",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
