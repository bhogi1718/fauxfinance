"use client";

import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/use-now";
import { formatRelativeTime } from "@/lib/format";

// Finnhub's free quote keeps reporting the last trade when the market is closed.
// If the last trade is more than 20 minutes old we treat it as closed/stale.
const STALE_AFTER_MS = 20 * 60 * 1000;

export function MarketStatus({ lastTradeAt }: { lastTradeAt: number | null | undefined }) {
  const now = useNow();
  if (!lastTradeAt || now === null) return null;
  const stale = now - lastTradeAt > STALE_AFTER_MS;

  return (
    <Badge variant={stale ? "secondary" : "outline"} className="gap-1.5 font-normal">
      <span
        className={stale ? "size-1.5 rounded-full bg-muted-foreground" : "size-1.5 animate-pulse rounded-full bg-gain"}
        aria-hidden
      />
      {stale ? `Market closed · last trade ${formatRelativeTime(lastTradeAt)}` : "Live"}
    </Badge>
  );
}
