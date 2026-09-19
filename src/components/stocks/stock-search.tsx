"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, History, LayoutDashboard, PieChart, Search, Settings, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useStocks } from "@/hooks/use-market";
import { formatCents, formatPercent, trendClass } from "@/lib/format";
import { STOCKS, SUPPORTED_SYMBOLS } from "@/lib/trading/constants";
import { cn } from "@/lib/utils";

const PAGES = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/history", label: "History", icon: History },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function StockSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: stocks } = useStocks();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden w-56 justify-start gap-2 text-muted-foreground md:flex"
        aria-label="Search stocks and pages"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search stocks…</span>
        <kbd className="pointer-events-none rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="md:hidden" aria-label="Search">
        <Search className="size-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a stock or page">
        <Command>
        <CommandInput placeholder="Search stocks or pages…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          <CommandGroup heading="Stocks">
            {SUPPORTED_SYMBOLS.map((symbol) => {
              const quote = stocks?.find((s) => s.symbol === symbol)?.quote ?? null;
              return (
                <CommandItem
                  key={symbol}
                  value={`${symbol} ${STOCKS[symbol].name}`}
                  onSelect={() => go(`/stocks/${symbol.toLowerCase()}`)}
                >
                  <span className="w-14 font-mono text-xs font-semibold">{symbol}</span>
                  <span className="flex-1 truncate">{STOCKS[symbol].name}</span>
                  {quote && (
                    <span className="flex items-center gap-2 tabular text-xs">
                      <span>{formatCents(quote.priceCents)}</span>
                      <span className={cn(trendClass(quote.changePercent))}>{formatPercent(quote.changePercent, { signed: true })}</span>
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Pages">
            {PAGES.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={label} onSelect={() => go(href)}>
                <Icon className="size-4" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
