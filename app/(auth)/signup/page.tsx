import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start taking verified donations in minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
