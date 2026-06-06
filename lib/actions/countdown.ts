"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { broadcastCountdown } from "@/lib/supabase/broadcast";
import type { CountdownState } from "@/lib/supabase/types";

type Row = {
  profile_id: string;
  enabled: boolean;
  running: boolean;
  ends_at: string | null;
  remaining_ms: number;
  baht_per_unit: number;
  minutes_per_unit: number;
};

async function loadContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("overlay_token")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  // Ensure a row exists.
  let { data: cd } = await supabase
    .from("countdowns")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!cd) {
    const { data } = await supabase
      .from("countdowns")
      .insert({ profile_id: user.id })
      .select("*")
      .single();
    cd = data;
  }
  if (!cd) return null;
  return { supabase, userId: user.id, token: profile.overlay_token, cd: cd as Row };
}

function liveState(cd: Row): CountdownState {
  return { running: cd.running, endsAt: cd.ends_at, remainingMs: cd.remaining_ms };
}

async function persist(
  ctx: { supabase: Awaited<ReturnType<typeof createClient>>; userId: string; token: string },
  patch: Partial<Omit<Row, "profile_id">>,
  state: CountdownState
) {
  const { error } = await ctx.supabase
    .from("countdowns")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("profile_id", ctx.userId);
  if (error) return { error: error.message };
  try {
    await broadcastCountdown(ctx.token, state);
  } catch {
    // overlay may be offline — fine
  }
  revalidatePath("/dashboard/countdown");
  return { ok: true };
}

export async function saveCountdownConfig(input: {
  enabled: boolean;
  bahtPerUnit: number;
  minutesPerUnit: number;
}): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await loadContext();
  if (!ctx) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  const bahtPerUnit = Math.max(1, Math.min(1_000_000, input.bahtPerUnit || 1));
  const minutesPerUnit = Math.max(
    0.1,
    Math.min(1440, input.minutesPerUnit || 1)
  );
  return persist(
    ctx,
    { enabled: !!input.enabled, baht_per_unit: bahtPerUnit, minutes_per_unit: minutesPerUnit },
    liveState(ctx.cd)
  );
}

export async function startCountdown(
  minutes: number
): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await loadContext();
  if (!ctx) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  const ms = Math.max(0, Math.round((minutes || 0) * 60_000));
  const endsAt = new Date(Date.now() + ms).toISOString();
  return persist(
    ctx,
    { running: true, ends_at: endsAt, remaining_ms: 0 },
    { running: true, endsAt, remainingMs: 0 }
  );
}

export async function pauseCountdown(): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await loadContext();
  if (!ctx) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  if (!ctx.cd.running || !ctx.cd.ends_at) return { ok: true };
  const remaining = Math.max(0, new Date(ctx.cd.ends_at).getTime() - Date.now());
  return persist(
    ctx,
    { running: false, ends_at: null, remaining_ms: remaining },
    { running: false, endsAt: null, remainingMs: remaining }
  );
}

export async function resumeCountdown(): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await loadContext();
  if (!ctx) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  if (ctx.cd.running) return { ok: true };
  const endsAt = new Date(Date.now() + (ctx.cd.remaining_ms || 0)).toISOString();
  return persist(
    ctx,
    { running: true, ends_at: endsAt, remaining_ms: 0 },
    { running: true, endsAt, remainingMs: 0 }
  );
}

export async function addCountdownMinutes(
  minutes: number
): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await loadContext();
  if (!ctx) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  const delta = Math.round((minutes || 0) * 60_000);
  if (ctx.cd.running) {
    const base = Math.max(Date.now(), new Date(ctx.cd.ends_at ?? "").getTime() || Date.now());
    const endsAt = new Date(base + delta).toISOString();
    return persist(ctx, { ends_at: endsAt }, { running: true, endsAt, remainingMs: 0 });
  }
  const remaining = Math.max(0, (ctx.cd.remaining_ms || 0) + delta);
  return persist(
    ctx,
    { remaining_ms: remaining },
    { running: false, endsAt: null, remainingMs: remaining }
  );
}

export async function resetCountdown(): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await loadContext();
  if (!ctx) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  return persist(
    ctx,
    { running: false, ends_at: null, remaining_ms: 0 },
    { running: false, endsAt: null, remainingMs: 0 }
  );
}
