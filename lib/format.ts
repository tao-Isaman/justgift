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
