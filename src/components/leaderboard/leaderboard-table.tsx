"use client";

import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeaderboard } from "@/hooks/use-market";
import { formatCents, formatPercent, trendClass } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/trading/portfolio";
import { cn } from "@/lib/utils";

const MEDALS = ["text-brand", "text-muted-foreground", "text-[oklch(0.65_0.1_60)]"];

export function LeaderboardTable({ initialData, currentUserId }: { initialData?: LeaderboardEntry[]; currentUserId?: string }) {
  const { data } = useLeaderboard(initialData);

  if (!data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
        <Trophy className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">No traders yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Be the first to sign up and claim the top spot.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Trader</TableHead>
            <TableHead className="text-right">Positions</TableHead>
            <TableHead className="text-right">Return</TableHead>
            <TableHead className="text-right">Portfolio value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => {
            const you = entry.userId === currentUserId;
            return (
              <TableRow key={entry.userId} className={cn(you && "bg-brand/5")}>
                <TableCell className="tabular font-semibold">
                  {entry.rank <= 3 ? (
                    <span className={cn("inline-flex items-center gap-1", MEDALS[entry.rank - 1])}>
                      <Trophy className="size-4" aria-hidden />
                      {entry.rank}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{initials(entry.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {entry.name}
                      {you && <span className="ml-2 text-xs text-brand">You</span>}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="tabular text-right text-muted-foreground">{entry.holdingsCount}</TableCell>
                <TableCell className={cn("tabular text-right font-medium", trendClass(entry.totalReturnPercent))}>
                  {formatPercent(entry.totalReturnPercent, { signed: true })}
                </TableCell>
                <TableCell className="tabular text-right font-semibold">{formatCents(entry.totalValueCents)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
