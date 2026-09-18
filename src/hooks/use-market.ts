"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Quote } from "@/lib/finnhub/quotes";
import type { PlaceOrderResult } from "@/lib/trading/engine";
import type { LeaderboardEntry, PortfolioView } from "@/lib/trading/portfolio";
import type { OrderSide, STOCKS, Symbol } from "@/lib/trading/constants";
import type { Transaction } from "@/lib/db/schema";

export const QUOTE_POLL_MS = 15_000;

export type StockListing = { symbol: Symbol; quote: Quote | null } & (typeof STOCKS)[Symbol];

export const keys = {
  stocks: ["stocks"] as const,
  quotes: (symbols: Symbol[]) => ["quotes", [...symbols].sort().join(",")] as const,
  portfolio: ["portfolio"] as const,
  watchlist: ["watchlist"] as const,
  history: ["history"] as const,
  leaderboard: ["leaderboard"] as const,
};

export function useStocks(initialData?: StockListing[]) {
  return useQuery({
    queryKey: keys.stocks,
    queryFn: () => api<StockListing[]>("/api/stocks"),
    refetchInterval: QUOTE_POLL_MS,
    initialData,
  });
}

export function useQuotes(symbols: Symbol[], opts?: { pollMs?: number; initialData?: Record<Symbol, Quote | null> }) {
  return useQuery({
    queryKey: keys.quotes(symbols),
    queryFn: () => api<Record<Symbol, Quote | null>>(`/api/quotes?symbols=${symbols.join(",")}`),
    refetchInterval: opts?.pollMs ?? QUOTE_POLL_MS,
    enabled: symbols.length > 0,
    initialData: opts?.initialData,
  });
}

export function usePortfolio(initialData?: PortfolioView) {
  return useQuery({
    queryKey: keys.portfolio,
    queryFn: () => api<PortfolioView>("/api/portfolio"),
    refetchInterval: QUOTE_POLL_MS,
    initialData,
  });
}

export interface WatchlistEntry {
  symbol: Symbol;
  addedAt: string;
  quote: Quote | null;
}

export function useWatchlist(initialData?: WatchlistEntry[]) {
  return useQuery({
    queryKey: keys.watchlist,
    queryFn: () => api<WatchlistEntry[]>("/api/watchlist"),
    refetchInterval: QUOTE_POLL_MS,
    initialData,
  });
}

export function useHistory(initialData?: { items: Transaction[]; nextCursor: string | null }) {
  return useQuery({
    queryKey: keys.history,
    queryFn: () => api<{ items: Transaction[]; nextCursor: string | null }>("/api/orders?limit=100"),
    initialData,
  });
}

export function useLeaderboard(initialData?: LeaderboardEntry[]) {
  return useQuery({
    queryKey: keys.leaderboard,
    queryFn: () => api<LeaderboardEntry[]>("/api/leaderboard"),
    refetchInterval: 30_000,
    initialData,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { symbol: Symbol; side: OrderSide; quantity: number }) =>
      api<PlaceOrderResult>("/api/orders", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.portfolio });
      void qc.invalidateQueries({ queryKey: keys.history });
      void qc.invalidateQueries({ queryKey: keys.leaderboard });
    },
  });
}

export function useToggleWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ symbol, watched }: { symbol: Symbol; watched: boolean }) =>
      watched
        ? api<{ symbol: Symbol }>(`/api/watchlist/${symbol}`, { method: "DELETE" })
        : api<{ symbol: Symbol }>("/api/watchlist", { method: "POST", body: JSON.stringify({ symbol }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.watchlist }),
  });
}
