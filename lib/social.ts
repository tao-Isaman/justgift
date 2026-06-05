import {
  AtSign,
  Camera,
  Globe,
  MessageCircle,
  Music2,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Socials } from "@/lib/supabase/types";

/** The social keys the settings form edits (subset of Socials). */
export type SocialKey =
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "discord"
  | "website";

/** Social platforms shown on the public profile + edited in settings. */
export const SOCIAL_PLATFORMS: {
  key: SocialKey;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "instagram", label: "Instagram", icon: Camera },
  { key: "x", label: "X (Twitter)", icon: AtSign },
  { key: "youtube", label: "YouTube", icon: Video },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "discord", label: "Discord", icon: MessageCircle },
  { key: "website", label: "เว็บไซต์", icon: Globe },
];

/** Normalise a stored social value (handle or URL) into an openable URL. */
export function socialUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Coerce the jsonb socials column into a typed object. */
export function asSocials(value: unknown): Socials {
  if (!value || typeof value !== "object") return {};
  return value as Socials;
}
