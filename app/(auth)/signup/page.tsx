import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export const metadata = { title: "สร้างบัญชี" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">สร้างบัญชี</CardTitle>
        <CardDescription>
          เริ่มรับโดเนทที่ตรวจสลิปแล้วได้ในไม่กี่นาที
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleButton label="สมัครด้วย Google" />
        <AuthDivider />
        <SignupForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
