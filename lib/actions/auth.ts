"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";

export type AuthResult = { error?: string; needsConfirmation?: boolean };

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export async function signIn(values: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });
  if (error) return { error: error.message };
  redirect(safeNext(values.next));
}

export async function signUp(values: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { display_name: values.displayName },
      emailRedirectTo: `${SITE.url}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };
  // When email confirmation is enabled, there's no session yet.
  if (!data.session) return { needsConfirmation: true };
  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
