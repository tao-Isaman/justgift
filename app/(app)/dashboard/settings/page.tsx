import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "ตั้งค่า" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          ตั้งค่าโปรไฟล์
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ปรับแต่งหน้าเพจรับโดเนทของคุณ ลิงก์โซเชียล และบัญชีรับเงิน
        </p>
      </header>
      <SettingsForm profile={profile} />
    </div>
  );
}
