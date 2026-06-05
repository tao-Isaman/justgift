import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { AlertSettingsForm } from "./alert-settings-form";

export const metadata = { title: "การแจ้งเตือน" };

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, overlay_token")
      .eq("id", userId)
      .single(),
    supabase
      .from("alert_settings")
      .select("*")
      .eq("profile_id", userId)
      .single(),
  ]);

  const overlayUrl = `${SITE.url}/overlay/${profile?.overlay_token ?? ""}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">ปรับแต่งการแจ้งเตือน</h1>
        <p className="text-sm text-muted-foreground">
          ออกแบบการแจ้งเตือนโดเนทที่จะแสดงบนสตรีมของคุณ
        </p>
      </div>
      <AlertSettingsForm
        plan={profile?.plan ?? "free"}
        settings={settings}
        overlayUrl={overlayUrl}
      />
    </div>
  );
}
