"use client";

import { type StockListing, useStocks } from "@/hooks/use-market";
import { WatchlistToggle } from "@/components/watchlist/watchlist-toggle";
import { StockCard, StockCardSkeleton } from "./stock-card";

export function StockList({ initialData, limit }: { initialData?: StockListing[]; limit?: number }) {
  const { data, isPending, isError } = useStocks(initialData);

  if (isPending) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: limit ?? 7 }).map((_, i) => (
          <StockCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-muted-foreground">Couldn&apos;t load the market right now. Try refreshing.</p>;
  }

  const items = limit ? data.slice(0, limit) : data;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((stock) => (
        <StockCard
          key={stock.symbol}
          symbol={stock.symbol}
          name={stock.name}
          sector={stock.sector}
          quote={stock.quote}
          aside={<WatchlistToggle symbol={stock.symbol} />}
        />
      ))}
    </div>
  );
}
