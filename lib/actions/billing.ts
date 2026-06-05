"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getPackage } from "@/lib/constants";

export async function createCheckout(
  packageId: string
): Promise<{ url?: string; error?: string }> {
  const pkg = getPackage(packageId);
  if (!pkg) return { error: "ไม่พบแพ็กเกจ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["promptpay"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "thb",
            unit_amount: Math.round(pkg.price * 100), // satang
            product_data: {
              name: `Just Donate ${pkg.tier.toUpperCase()} — ${pkg.label}`,
            },
          },
        },
      ],
      metadata: {
        profile_id: user.id,
        package_id: pkg.id,
        tier: pkg.tier,
        days: String(pkg.days),
      },
      customer_email: user.email ?? undefined,
      success_url: `${appUrl}/dashboard/billing?status=success`,
      cancel_url: `${appUrl}/dashboard/billing?status=cancel`,
    });

    if (!session.url) return { error: "สร้างการชำระเงินไม่สำเร็จ" };
    return { url: session.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Stripe error" };
  }
}
