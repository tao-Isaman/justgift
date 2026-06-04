import { Settings } from "lucide-react";
import { PageStub } from "@/components/dashboard/page-stub";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageStub
      title="Settings"
      description="Profile, payout account and account preferences."
      icon={<Settings className="size-6" />}
    />
  );
}
