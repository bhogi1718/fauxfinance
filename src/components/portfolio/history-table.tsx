"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHistory } from "@/hooks/use-market";
import type { Transaction } from "@/lib/db/schema";
import { formatCents, formatDateTime, formatSignedCents, trendClass } from "@/lib/format";

type HistoryData = { items: Transaction[]; nextCursor: string | null };

export function HistoryTable({ initialData }: { initialData?: HistoryData }) {
  const { data } = useHistory(initialData);

  if (!data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
        <p className="font-medium">No trades yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Every buy and sell you make will show up here.</p>
        <Button className="mt-5" render={<Link href="/explore" />}>
          Make your first trade
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Realized P&L</TableHead>
            <TableHead className="text-right">Cash after</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={t.side === "BUY" ? "border-gain/40 text-gain" : "border-loss/40 text-loss"}>
                  {t.side}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/stocks/${t.symbol.toLowerCase()}`} className="font-medium hover:underline">
                  {t.symbol}
                </Link>
              </TableCell>
              <TableCell className="tabular text-right">{t.quantity.toLocaleString()}</TableCell>
              <TableCell className="tabular text-right">{formatCents(t.priceCents)}</TableCell>
              <TableCell className="tabular text-right font-medium">{formatCents(t.totalCents)}</TableCell>
              <TableCell className={`tabular text-right ${trendClass(t.realizedPnlCents)}`}>
                {t.realizedPnlCents === null ? "—" : formatSignedCents(t.realizedPnlCents)}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">{formatCents(t.cashBalanceAfterCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
