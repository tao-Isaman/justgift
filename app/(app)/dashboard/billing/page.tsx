import { CreditCard } from "lucide-react";
import { PageStub } from "@/components/dashboard/page-stub";

export const metadata = { title: "การเรียกเก็บเงิน" };

export default function BillingPage() {
  return (
    <PageStub
      title="การเรียกเก็บเงิน"
      description="จัดการแพ็กเกจสมาชิก JustGift ของคุณ"
      icon={<CreditCard className="size-6" />}
    />
  );
}
