"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api/client";
import { formatCents, formatPercent, formatSignedCents, trendClass } from "@/lib/format";
import type { PerformancePoint, PerformanceRange } from "@/lib/trading/snapshots";
import { cn } from "@/lib/utils";

const RANGES: PerformanceRange[] = ["1D", "1W", "1M", "ALL"];

const config = {
  value: { label: "Portfolio value", color: "var(--brand)" },
} satisfies ChartConfig;

export function PerformanceChart({ className }: { className?: string }) {
  const [range, setRange] = useState<PerformanceRange>("1M");
  const { data, isPending } = useQuery({
    queryKey: ["performance", range],
    queryFn: () => api<{ range: PerformanceRange; points: PerformancePoint[] }>(`/api/portfolio/performance?range=${range}`),
    refetchInterval: 60_000,
  });

  const points = data?.points ?? [];
  const first = points[0]?.totalValueCents ?? 0;
  const last = points[points.length - 1]?.totalValueCents ?? 0;
  const delta = last - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;
  const positive = delta >= 0;

  const series = points.map((p) => ({ at: new Date(p.at).getTime(), value: p.totalValueCents / 100 }));
  const values = series.map((s) => s.value);
  const pad = values.length ? Math.max((Math.max(...values) - Math.min(...values)) * 0.15, 50) : 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Performance</CardTitle>
          {isPending ? (
            <Skeleton className="mt-1 h-5 w-40" />
          ) : (
            <p className={cn("mt-1 text-sm font-medium tabular", trendClass(delta))}>
              {formatSignedCents(delta)} ({formatPercent(deltaPct, { signed: true })}) over {range === "ALL" ? "all time" : range}
            </p>
          )}
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as PerformanceRange)}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r} value={r} className="px-2.5 text-xs">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ChartContainer config={config} className="h-56 w-full">
            <AreaChart data={series} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={positive ? "var(--gain)" : "var(--loss)"} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={positive ? "var(--gain)" : "var(--loss)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis
                dataKey="at"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                tickLine={false}
                axisLine={false}
                minTickGap={48}
                tickFormatter={(v: number) => formatTick(v, range)}
              />
              <YAxis
                width={64}
                tickLine={false}
                axisLine={false}
                domain={[(min: number) => Math.floor(min - pad), (max: number) => Math.ceil(max + pad)]}
                tickFormatter={(v: number) => formatCents(v * 100, { compact: true })}
              />
              <ChartTooltip
                cursor={{ strokeOpacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const at = payload?.[0]?.payload?.at as number | undefined;
                      return at ? new Date(at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
                    }}
                    formatter={(value) => [formatCents(Number(value) * 100), " Portfolio value"]}
                  />
                }
              />
              <Area
                dataKey="value"
                type="monotone"
                stroke={positive ? "var(--gain)" : "var(--loss)"}
                strokeWidth={2}
                fill="url(#perf-fill)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function formatTick(ms: number, range: PerformanceRange) {
  const d = new Date(ms);
  if (range === "1D") return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
