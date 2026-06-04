"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { saveOnboarding } from "@/lib/actions/profile";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations";
import { THAI_BANKS } from "@/lib/constants";

export function OnboardingForm({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      displayName: defaultDisplayName,
      receiverName: "",
      promptpayId: "",
      bankName: "",
      bankAccount: "",
    },
  });

  function onSubmit(values: OnboardingValues) {
    startTransition(async () => {
      const res = await saveOnboarding(values);
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your page URL</FormLabel>
              <FormControl>
                <div className="flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
                  <span className="pl-2.5 text-sm text-muted-foreground select-none">
                    justgift.app/
                  </span>
                  <input
                    {...field}
                    className="h-8 w-full bg-transparent pr-2.5 pl-0.5 text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="yourname"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="receiverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account holder name</FormLabel>
              <FormControl>
                <Input placeholder="Name on your bank / PromptPay" {...field} />
              </FormControl>
              <FormDescription>
                We match this against the donor&apos;s slip to verify the
                payment reached you.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border border-border/60 p-4">
          <p className="mb-3 text-sm font-medium">How donors pay you</p>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="promptpayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PromptPay ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Phone or National ID"
                      inputMode="numeric"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="relative flex items-center justify-center">
              <span className="hairline absolute inset-x-0 top-1/2 h-px" />
              <span className="relative bg-card px-2 text-xs text-muted-foreground">
                and / or
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">Select a bank…</option>
                        {THAI_BANKS.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="xxx-x-xxxxx-x"
                        inputMode="numeric"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="glow-red-sm w-full"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Saving…" : "Finish setup"}
        </Button>
      </form>
    </Form>
  );
}
