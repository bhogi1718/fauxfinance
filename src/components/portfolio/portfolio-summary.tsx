"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio } from "@/hooks/use-market";
import { formatCents, formatPercent, formatSignedCents, trendClass } from "@/lib/format";
import type { PortfolioView } from "@/lib/trading/portfolio";
import { cn } from "@/lib/utils";

export function PortfolioSummary({ initialData }: { initialData?: PortfolioView }) {
  const { data } = usePortfolio(initialData);

  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-2 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
    {data.quotesStale && (
      <p role="status" className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Live prices are unavailable right now — positions are shown at cost until quotes come back.
      </p>
    )}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label="Total value"
        value={formatCents(data.totalValueCents)}
        sub={
          <span className={trendClass(data.totalReturnCents)}>
            {formatSignedCents(data.totalReturnCents)} ({formatPercent(data.totalReturnPercent, { signed: true })}) all time
          </span>
        }
        accent
      />
      <Tile label="Cash" value={formatCents(data.cashCents)} sub="Available to trade" />
      <Tile
        label="Holdings"
        value={formatCents(data.holdingsValueCents)}
        sub={`${data.holdings.length} position${data.holdings.length === 1 ? "" : "s"} · ${formatCents(data.investedCents)} invested`}
      />
      <Tile
        label="Unrealized P&L"
        value={<span className={trendClass(data.unrealizedPnlCents)}>{formatSignedCents(data.unrealizedPnlCents)}</span>}
        sub={
          <>
            Realized <span className={trendClass(data.realizedPnlCents)}>{formatSignedCents(data.realizedPnlCents)}</span>
          </>
        }
      />
    </div>
    </div>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={cn("gap-1.5 p-5", accent && "border-brand/40 bg-linear-to-br from-brand/10 to-transparent")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="tabular text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
