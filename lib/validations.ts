import { z } from "zod";
import { RESERVED_USERNAMES } from "@/lib/constants";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "3–20 characters: a–z, 0–9, underscore")
  .refine((u) => !RESERVED_USERNAMES.has(u), "That username is reserved");

export const onboardingSchema = z
  .object({
    username: usernameSchema,
    displayName: z.string().trim().min(2, "At least 2 characters").max(40),
    receiverName: z
      .string()
      .trim()
      .min(2, "Enter the name on your account")
      .max(80),
    promptpayId: z.string().trim().max(40).optional().or(z.literal("")),
    bankName: z.string().trim().max(40).optional().or(z.literal("")),
    bankAccount: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((v) => !!v.promptpayId || (!!v.bankName && !!v.bankAccount), {
    message: "Add a PromptPay ID, or a bank with its account number",
    path: ["promptpayId"],
  });

export type OnboardingValues = z.infer<typeof onboardingSchema>;

/** Donor-facing donation form. */
export const donationSchema = z.object({
  donorName: z.string().trim().min(1, "Enter a name").max(40),
  message: z.string().trim().max(200, "Keep it under 200 characters").optional(),
  amount: z.coerce
    .number()
    .positive("Enter an amount")
    .max(1_000_000, "That's a bit much"),
});

export type DonationValues = z.infer<typeof donationSchema>;
