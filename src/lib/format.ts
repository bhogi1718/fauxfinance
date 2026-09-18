const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("en-US");

export function formatCents(cents: number | null | undefined, opts?: { compact?: boolean }) {
  if (cents === null || cents === undefined) return "—";
  return (opts?.compact ? usdCompact : usd).format(cents / 100);
}

export function formatSignedCents(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "—";
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return `${sign}${usd.format(Math.abs(cents) / 100)}`;
}

export function formatPercent(value: number | null | undefined, opts?: { signed?: boolean }) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = opts?.signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function formatNumber(value: number) {
  return number.format(value);
}

export function formatShares(qty: number) {
  return `${number.format(qty)} ${qty === 1 ? "share" : "shares"}`;
}

export function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value: Date | string | number) {
  const diffMs = Date.now() - new Date(value).getTime();
  const s = Math.round(diffMs / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function trendClass(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-gain" : "text-loss";
}
