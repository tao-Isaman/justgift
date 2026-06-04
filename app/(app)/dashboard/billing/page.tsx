import { CreditCard } from "lucide-react";
import { PageStub } from "@/components/dashboard/page-stub";

export const metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <PageStub
      title="Billing"
      description="Manage your JustGift subscription."
      icon={<CreditCard className="size-6" />}
    />
  );
}
