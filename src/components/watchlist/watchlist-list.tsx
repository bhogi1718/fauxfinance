"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { StockCard, StockCardSkeleton } from "@/components/stocks/stock-card";
import { Button } from "@/components/ui/button";
import { type WatchlistEntry, useWatchlist } from "@/hooks/use-market";
import { STOCKS } from "@/lib/trading/constants";
import { WatchlistToggle } from "./watchlist-toggle";

export function WatchlistList({ initialData }: { initialData?: WatchlistEntry[] }) {
  const { data, isPending } = useWatchlist(initialData);

  if (isPending || !data) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <StockCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
        <Star className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">Your watchlist is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">Tap the star on any stock to keep an eye on it here.</p>
        <Button className="mt-5" render={<Link href="/explore" />}>
          Browse stocks
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {data.map((entry) => (
        <StockCard
          key={entry.symbol}
          symbol={entry.symbol}
          name={STOCKS[entry.symbol].name}
          sector={STOCKS[entry.symbol].sector}
          quote={entry.quote}
          aside={<WatchlistToggle symbol={entry.symbol} />}
        />
      ))}
    </div>
  );
}
