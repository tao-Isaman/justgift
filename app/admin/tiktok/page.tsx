import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tiktokConfigured } from "@/lib/tiktok";
import { TikTokPoster } from "@/components/admin/tiktok-poster";

export const metadata = { title: "TikTok" };

export default async function AdminTikTokPage() {
  const configured = tiktokConfigured();

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("tiktok_connection")
    .select("open_id, display_name, scope, expires_at, created_at")
    .limit(1)
    .maybeSingle();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          การตลาด TikTok
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          อัปโหลดวิดีโอจากที่นี่ไปยังกล่องข้อความ (inbox) ของบัญชี TikTok แบรนด์
          แล้วเปิดแอป TikTok เพื่อใส่แคปชันและโพสต์
        </p>
      </header>
      <TikTokPoster
        configured={configured}
        connection={connection ?? null}
        userId={user?.id ?? ""}
      />
    </div>
  );
}
