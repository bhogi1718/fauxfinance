import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/format";
import type { Quote } from "@/lib/finnhub/quotes";
import type { Symbol } from "@/lib/trading/constants";
import { PriceChange } from "./price-change";

interface StockCardProps {
  symbol: Symbol;
  name: string;
  sector?: string;
  quote: Quote | null;
  aside?: React.ReactNode;
}

export function StockCard({ symbol, name, sector, quote, aside }: StockCardProps) {
  return (
    <Card className="group relative flex flex-row items-center gap-4 p-4 transition-colors hover:border-brand/40">
      <Link href={`/stocks/${symbol.toLowerCase()}`} className="absolute inset-0 rounded-[inherit]" aria-label={`View ${name}`}>
        <span className="sr-only">View {name}</span>
      </Link>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tracking-wide">
        {symbol.slice(0, 4)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {symbol}
          {sector ? ` · ${sector}` : ""}
        </p>
      </div>
      <div className="text-right">
        {quote ? (
          <>
            <p className="tabular font-semibold">{formatCents(quote.priceCents)}</p>
            <PriceChange changePercent={quote.changePercent} className="text-xs" />
          </>
        ) : (
          <div className="space-y-1.5">
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        )}
      </div>
      {aside && <div className="relative z-10">{aside}</div>}
    </Card>
  );
}

export function StockCardSkeleton() {
  return (
    <Card className="flex flex-row items-center gap-4 p-4">
      <Skeleton className="size-11 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  );
}
