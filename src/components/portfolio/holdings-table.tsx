"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePortfolio } from "@/hooks/use-market";
import { formatCents, formatPercent, formatSignedCents, trendClass } from "@/lib/format";
import type { PortfolioView } from "@/lib/trading/portfolio";

export function HoldingsTable({ initialData, compact }: { initialData?: PortfolioView; compact?: boolean }) {
  const { data } = usePortfolio(initialData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Holdings</CardTitle>
        {compact && (
          <Button variant="ghost" size="sm" render={<Link href="/portfolio" />}>
            View all <ArrowRight />
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-0">
        {!data ? (
          <div className="space-y-3 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.holdings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-medium">No positions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Pick a stock and place your first trade.</p>
            <Button className="mt-4" render={<Link href="/explore" />}>
              Explore stocks
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Unrealized P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.holdings.map((h) => (
                <TableRow key={h.symbol}>
                  <TableCell>
                    <Link href={`/stocks/${h.symbol.toLowerCase()}`} className="font-medium hover:underline">
                      {h.symbol}
                    </Link>
                    {!compact && <p className="text-xs text-muted-foreground">{h.name}</p>}
                  </TableCell>
                  <TableCell className="tabular text-right">{h.quantity.toLocaleString()}</TableCell>
                  <TableCell className="tabular text-right">{formatCents(h.avgCostCents)}</TableCell>
                  <TableCell className="tabular text-right">
                    {formatCents(h.currentPriceCents)}
                    {h.dayChangePercent !== null && (
                      <p className={`text-xs ${trendClass(h.dayChangePercent)}`}>{formatPercent(h.dayChangePercent, { signed: true })}</p>
                    )}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">{formatCents(h.marketValueCents)}</TableCell>
                  <TableCell className={`tabular text-right ${trendClass(h.unrealizedPnlCents)}`}>
                    {formatSignedCents(h.unrealizedPnlCents)}
                    <p className="text-xs">{formatPercent(h.unrealizedPnlPercent, { signed: true })}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
