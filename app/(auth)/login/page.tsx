import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ยินดีต้อนรับกลับ</CardTitle>
        <CardDescription>เข้าสู่ระบบเพื่อจัดการโดเนทของคุณ</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleButton next={next} />
        <AuthDivider />
        <LoginForm next={next} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            สร้างบัญชี
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
