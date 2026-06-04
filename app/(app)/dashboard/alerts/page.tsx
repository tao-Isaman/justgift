import { Bell } from "lucide-react";
import { PageStub } from "@/components/dashboard/page-stub";

export const metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <PageStub
      title="Alert customization"
      description="Colors, fonts, sounds, alert image and text-to-speech."
      icon={<Bell className="size-6" />}
    />
  );
}
