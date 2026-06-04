"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations";

export async function saveOnboarding(
  raw: OnboardingValues
): Promise<{ error?: string }> {
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: v.username,
      display_name: v.displayName,
      receiver_name: v.receiverName,
      promptpay_id: v.promptpayId || null,
      bank_name: v.bankName || null,
      bank_account: v.bankAccount || null,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
