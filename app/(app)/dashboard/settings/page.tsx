import { Settings } from "lucide-react";
import { PageStub } from "@/components/dashboard/page-stub";

export const metadata = { title: "ตั้งค่า" };

export default function SettingsPage() {
  return (
    <PageStub
      title="ตั้งค่า"
      description="โปรไฟล์ บัญชีรับเงิน และการตั้งค่าบัญชี"
      icon={<Settings className="size-6" />}
    />
  );
}
