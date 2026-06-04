"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/actions/auth";

const schema = z.object({
  displayName: z
    .string()
    .min(2, "At least 2 characters")
    .max(40, "Too long"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type Values = z.infer<typeof schema>;

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const res = await signUp(values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.needsConfirmation) {
        setSentTo(values.email);
      }
    });
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </span>
        <p className="font-heading text-lg font-semibold">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="text-foreground">{sentTo}</span>. Click it to finish
          creating your account.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="Your channel name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...field}
                />
              </FormControl>
              <FormDescription>Use 8 or more characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
