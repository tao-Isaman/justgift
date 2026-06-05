import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DonateForm } from "./donate-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `โดเนทให้ @${username}`,
    description: `โดเนทให้ @${username} ผ่านพร้อมเพย์หรือโอนธนาคาร — ระบบโดเนทตรวจสลิปอัตโนมัติ แจ้งเตือนขึ้นจอสตรีมทันที | JustGift`,
    alternates: { canonical: `/${username}` },
    openGraph: {
      title: `โดเนทให้ @${username} | JustGift`,
      description:
        "รับโดเนทพร้อมเพย์ ตรวจสลิปอัตโนมัติ แจ้งเตือนโดเนทขึ้นจอทันที",
      type: "profile",
    },
  };
}

export default async function DonatePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const initials = (profile.display_name ?? "JG").slice(0, 2).toUpperCase();

  return (
    <div className="relative flex min-h-svh flex-col">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-glow" />

      <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between px-4 py-5">
        <Logo />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl flex-1 px-4 pb-16">
        <div className="flex flex-col items-center text-center">
          <Avatar className="size-20 ring-2 ring-primary/40">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="font-display text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h1 className="font-heading mt-4 text-3xl font-bold">
            {profile.display_name ?? `@${profile.username}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            @{profile.username}
          </p>
          {profile.bio ? (
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {profile.bio}
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          <DonateForm
            username={profile.username ?? username}
            displayName={profile.display_name ?? `@${profile.username}`}
            promptpayId={profile.promptpay_id}
            bankName={profile.bank_name}
            bankAccount={profile.bank_account}
            mediaEnabled={profile.media_enabled}
            mediaMin={Number(profile.media_min_amount)}
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ขับเคลื่อนโดย{" "}
          <Link href="/" className="text-primary hover:underline">
            JustGift
          </Link>{" "}
          · ทุกสลิปถูกตรวจสอบกับธนาคารก่อนแสดงการแจ้งเตือน
        </p>
      </main>
    </div>
  );
}
