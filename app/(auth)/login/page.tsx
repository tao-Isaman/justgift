import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to your JustGift dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to JustGift?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
