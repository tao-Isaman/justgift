import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GoalBar } from "@/components/goal-bar";
import { LeaderboardCard } from "@/components/leaderboard-card";
import { DonateForm } from "./donate-form";
import { MembershipJoin, type JoinTier } from "./membership-join";
import { SOCIAL_PLATFORMS, asSocials, socialUrl } from "@/lib/social";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `โดเนทให้ @${username}`,
    description: `โดเนทให้ @${username} ผ่านพร้อมเพย์หรือโอนธนาคาร — ระบบโดเนทตรวจสลิปอัตโนมัติ แจ้งเตือนขึ้นจอสตรีมทันที | Just Gift`,
    alternates: { canonical: `/${username}` },
    openGraph: {
      title: `โดเนทให้ @${username} | Just Gift`,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Active membership tiers (RLS exposes active rows to anyone).
  const { data: tierRows } = await supabase
    .from("membership_tiers")
    .select("id, name, price, days, perks, color")
    .eq("streamer_id", profile.id)
    .eq("active", true)
    .order("sort", { ascending: true });

  const tiers: JoinTier[] = (tierRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    price: Number(t.price),
    days: t.days,
    perks: t.perks ?? [],
    color: t.color,
  }));

  // Goal + leaderboard (per the streamer's public-page toggles).
  const goal = profile.show_goal
    ? (await supabase.rpc("public_goal", { p_username: username })).data?.[0]
    : null;
  const leaders = profile.show_leaderboard
    ? (
        await supabase.rpc("public_top_donors", {
          p_username: username,
          p_limit: 5,
        })
      ).data ?? []
    : [];

  // The viewer's current membership to this streamer (if signed in).
  let current = null;
  if (user) {
    const { data } = await supabase
      .from("memberships")
      .select("tier_name, period_end, status")
      .eq("streamer_id", profile.id)
      .eq("member_id", user.id)
      .maybeSingle();
    current = data;
  }

  const accent = profile.accent_color || "#dc2626";
  const socials = asSocials(profile.socials);
  const initials = (profile.display_name ?? "JD").slice(0, 2).toUpperCase();
  const goalActive = !!goal?.enabled && Number(goal.target) > 0;

  return (
    <div className="relative flex min-h-svh flex-col">
      {!profile.banner_url ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-grid" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-glow" />
        </>
      ) : null}

      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-5">
        <Logo />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 pb-16">
        {/* Banner */}
        {profile.banner_url ? (
          <div className="relative mb-[-3rem] h-40 overflow-hidden rounded-xl border border-border/60 sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.banner_url}
              alt=""
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          </div>
        ) : null}

        {/* Identity */}
        <div className="relative flex flex-col items-center text-center">
          <span
            className="rounded-full"
            style={{ boxShadow: `0 0 0 2px ${accent}, 0 0 28px ${accent}55` }}
          >
            <Avatar className="size-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="font-display text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </span>
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

          {/* Socials */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SOCIAL_PLATFORMS.map((p) => {
              const href = socialUrl(socials[p.key]);
              if (!href) return null;
              return (
                <a
                  key={p.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={p.label}
                  className="grid size-9 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <p.icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Goal */}
        {goalActive ? (
          <div className="mt-8">
            <GoalBar
              title={goal!.title || "เป้าหมายโดเนท"}
              total={Number(goal!.raised)}
              goalAmount={Number(goal!.target)}
              accentColor={accent}
            />
          </div>
        ) : null}

        {/* Donate */}
        <div className="mt-8">
          <DonateForm
            username={profile.username ?? username}
            displayName={profile.display_name ?? `@${profile.username}`}
            promptpayId={profile.promptpay_id}
            bankName={profile.bank_name}
            bankAccount={profile.bank_account}
            mediaEnabled={profile.media_enabled}
            mediaMin={Number(profile.media_min_amount)}
            suggestedAmounts={profile.suggested_amounts ?? []}
          />
        </div>

        {/* Membership */}
        <MembershipJoin
          username={profile.username ?? username}
          displayName={profile.display_name ?? `@${profile.username}`}
          tiers={tiers}
          promptpayId={profile.promptpay_id}
          bankName={profile.bank_name}
          bankAccount={profile.bank_account}
          isLoggedIn={!!user}
          loginHref={`/login?next=${encodeURIComponent(`/${username}`)}`}
          current={current}
        />

        {/* Leaderboard */}
        {leaders.length > 0 ? (
          <div className="mt-10">
            <LeaderboardCard
              accentColor={accent}
              entries={leaders.map((l) => ({
                name: l.donor_name,
                total: Number(l.total),
              }))}
            />
          </div>
        ) : null}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          ขับเคลื่อนโดย{" "}
          <Link href="/" className="text-primary hover:underline">
            Just Gift
          </Link>{" "}
          · ทุกสลิปถูกตรวจสอบกับธนาคารก่อนแสดงการแจ้งเตือน
        </p>
      </main>
    </div>
  );
}
