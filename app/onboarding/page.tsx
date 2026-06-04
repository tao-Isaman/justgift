import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "ตั้งค่าเพจ" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarded")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) redirect("/dashboard");

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">ตั้งค่าเพจของคุณ</CardTitle>
            <CardDescription>
              ตั้งชื่อลิงก์เพจและบอกเราว่าให้โดเนทเข้าบัญชีไหน
              เปลี่ยนภายหลังได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              defaultDisplayName={
                profile?.display_name ?? user.email?.split("@")[0] ?? ""
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
