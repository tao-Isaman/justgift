import { Bell } from "lucide-react";
import { PageStub } from "@/components/dashboard/page-stub";

export const metadata = { title: "การแจ้งเตือน" };

export default function AlertsPage() {
  return (
    <PageStub
      title="ปรับแต่งการแจ้งเตือน"
      description="สี ฟอนต์ เสียง ภาพแจ้งเตือน และอ่านข้อความเป็นเสียง"
      icon={<Bell className="size-6" />}
    />
  );
}
