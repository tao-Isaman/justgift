import { formatDistanceToNowStrict } from "date-fns";

const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const thbCompact = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatTHB(amount: number, compact = false) {
  return (compact ? thbCompact : thbFormatter).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

/** Whole days from now until `date` (0 if past, null if no date). */
export function daysUntil(date: string | Date | null): number | null {
  if (!date) return null;
  return Math.max(
    0,
    Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
  );
}

/** True if `date` is still in the future (e.g. an active membership period). */
export function isFuture(date: string | Date | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() > Date.now();
}
