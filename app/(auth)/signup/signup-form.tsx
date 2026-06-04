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
    .min(2, "อย่างน้อย 2 ตัวอักษร")
    .max(40, "ยาวเกินไป"),
  email: z.email("กรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "อย่างน้อย 8 ตัวอักษร"),
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
        <p className="font-heading text-lg font-semibold">
          ตรวจสอบอีเมลของคุณ
        </p>
        <p className="text-sm text-muted-foreground">
          เราส่งลิงก์ยืนยันไปที่{" "}
          <span className="text-foreground">{sentTo}</span> แล้ว
          คลิกลิงก์เพื่อสร้างบัญชีให้เสร็จสมบูรณ์
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
              <FormLabel>ชื่อที่แสดง</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อช่องของคุณ" {...field} />
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
              <FormLabel>อีเมล</FormLabel>
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
              <FormLabel>รหัสผ่าน</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  {...field}
                />
              </FormControl>
              <FormDescription>ใช้อย่างน้อย 8 ตัวอักษร</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "กำลังสร้างบัญชี…" : "สร้างบัญชี"}
        </Button>
      </form>
    </Form>
  );
}
