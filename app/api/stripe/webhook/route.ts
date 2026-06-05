import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json(
      { error: "missing signature or webhook secret" },
      { status: 400 }
    );
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      try {
        await fulfill(session);
      } catch {
        // Return 500 so Stripe retries delivery.
        return NextResponse.json(
          { error: "fulfillment failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfill(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const profileId = md.profile_id;
  const tier = md.tier as "pro" | "elite" | undefined;
  const days = Number(md.days);
  const packageId = md.package_id ?? "";
  if (!profileId || !tier || !Number.isFinite(days) || days <= 0) return;

  const admin = createAdminClient();

  // Idempotent: the UNIQUE stripe_session_id blocks double-processing.
  const { error: insErr } = await admin.from("subscription_payments").insert({
    profile_id: profileId,
    package_id: packageId,
    tier,
    days,
    amount: (session.amount_total ?? 0) / 100,
    currency: (session.currency ?? "thb").toUpperCase(),
    method: "stripe",
    status: "paid",
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    period_start: new Date().toISOString(),
  });

  if (insErr) {
    if (insErr.code === "23505") return; // already processed
    throw new Error(`payment insert failed: ${insErr.message}`);
  }

  const { data: newExpiry, error: rpcErr } = await admin.rpc(
    "apply_subscription",
    { p_profile: profileId, p_tier: tier, p_days: days }
  );
  if (rpcErr) throw new Error(`activation failed: ${rpcErr.message}`);

  if (newExpiry) {
    await admin
      .from("subscription_payments")
      .update({ period_end: newExpiry })
      .eq("stripe_session_id", session.id);
  }
}
