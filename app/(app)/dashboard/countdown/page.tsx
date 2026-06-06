import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { CountdownForm } from "./countdown-form";

export const metadata = { title: "นับถอยหลัง" };

export default async function CountdownPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("overlay_token")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: cd } = await supabase
    .from("countdowns")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          ตัวจับเวลานับถอยหลัง
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตั้งเวลาบนสตรีม แล้วให้ผู้ชมโดเนทเพื่อเพิ่มเวลา
        </p>
      </header>
      <CountdownForm
        initial={{
          enabled: cd?.enabled ?? false,
          running: cd?.running ?? false,
          endsAt: cd?.ends_at ?? null,
          remainingMs: cd?.remaining_ms ?? 0,
          bahtPerUnit: Number(cd?.baht_per_unit ?? 10),
          minutesPerUnit: Number(cd?.minutes_per_unit ?? 1),
        }}
        overlayUrl={`${SITE.url}/overlay/${profile.overlay_token}/countdown`}
      />
    </div>
  );
}
