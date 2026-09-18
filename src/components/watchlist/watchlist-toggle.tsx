"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useToggleWatchlist, useWatchlist } from "@/hooks/use-market";
import type { Symbol } from "@/lib/trading/constants";
import { cn } from "@/lib/utils";

export function WatchlistToggle({ symbol, size = "icon" }: { symbol: Symbol; size?: "icon" | "default" }) {
  const { data } = useWatchlist();
  const toggle = useToggleWatchlist();
  const watched = data?.some((w) => w.symbol === symbol) ?? false;

  function onClick() {
    toggle.mutate(
      { symbol, watched },
      {
        onSuccess: () => toast.success(watched ? `Removed ${symbol} from watchlist` : `Added ${symbol} to watchlist`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Button
      variant={size === "icon" ? "ghost" : "outline"}
      size={size}
      onClick={onClick}
      disabled={toggle.isPending}
      aria-pressed={watched}
      aria-label={watched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
    >
      <Star className={cn("size-4", watched && "fill-brand text-brand")} />
      {size === "default" && (watched ? "Watching" : "Watch")}
    </Button>
  );
}
