import "server-only";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { holdings, transactions, user, wallets, watchlistItems } from "@/lib/db/schema";
import { getQuotes, type Quote } from "@/lib/market/quotes";
import { STARTING_CASH_CENTS, SUPPORTED_SYMBOLS, type StockSymbol, isSupportedSymbol } from "./constants";
import { ensureWallet } from "./engine";
import { maybeRecordSnapshot } from "./snapshots";
import {
  computeHoldingsValueCents,
  computeReturnPercent,
  computeTotalPortfolioValueCents,
  computeUnrealizedPnlCents,
} from "./math";

export interface HoldingView {
  symbol: StockSymbol;
  name: string;
  quantity: number;
  avgCostCents: number;
  investedCents: number;
  currentPriceCents: number | null;
  marketValueCents: number | null;
  unrealizedPnlCents: number | null;
  unrealizedPnlPercent: number | null;
  dayChangePercent: number | null;
}

export interface PortfolioView {
  cashCents: number;
  investedCents: number;
  holdingsValueCents: number;
  totalValueCents: number;
  unrealizedPnlCents: number;
  realizedPnlCents: number;
  totalReturnCents: number;
  totalReturnPercent: number;
  startingCashCents: number;
  holdings: HoldingView[];
  quotesStale: boolean;
}

export async function getPortfolio(userId: string): Promise<PortfolioView> {
  await ensureWallet(userId);

  const [[wallet], rows, [pnl]] = await Promise.all([
    db.select().from(wallets).where(eq(wallets.userId, userId)),
    db.select().from(holdings).where(eq(holdings.userId, userId)).orderBy(holdings.symbol),
    db
      .select({ realized: sql<string>`coalesce(sum(${transactions.realizedPnlCents}), 0)` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.side, "SELL"))),
  ]);

  const symbols = rows.map((r) => r.symbol).filter(isSupportedSymbol);
  const quotes = symbols.length ? await getQuotes(symbols) : ({} as Record<StockSymbol, Quote | null>);

  let quotesStale = false;
  const views: HoldingView[] = rows.map((row) => {
    const symbol = row.symbol as StockSymbol;
    const quote = quotes[symbol] ?? null;
    if (!quote) quotesStale = true;
    const investedCents = row.quantity * row.avgCostCents;
    const unrealized = quote ? computeUnrealizedPnlCents(row.quantity, quote.priceCents, row.avgCostCents) : null;
    return {
      symbol,
      name: quote?.name ?? symbol,
      quantity: row.quantity,
      avgCostCents: row.avgCostCents,
      investedCents,
      currentPriceCents: quote?.priceCents ?? null,
      marketValueCents: quote ? row.quantity * quote.priceCents : null,
      unrealizedPnlCents: unrealized,
      unrealizedPnlPercent: unrealized !== null && investedCents > 0 ? (unrealized / investedCents) * 100 : null,
      dayChangePercent: quote?.changePercent ?? null,
    };
  });

  // Holdings without a live quote are valued at cost so totals degrade to "no change"
  // rather than silently dropping to zero; `quotesStale` tells the UI to say so.
  const valued = views.map((v) => ({
    quantity: v.quantity,
    currentPriceCents: v.currentPriceCents ?? v.avgCostCents,
  }));

  const holdingsValueCents = computeHoldingsValueCents(valued);
  const totalValueCents = computeTotalPortfolioValueCents(wallet.balanceCents, valued);
  const investedCents = views.reduce((s, v) => s + v.investedCents, 0);
  const realizedPnlCents = Number(pnl?.realized ?? 0);

  if (!quotesStale) {
    await maybeRecordSnapshot(userId, totalValueCents, wallet.balanceCents);
  }

  return {
    cashCents: wallet.balanceCents,
    investedCents,
    holdingsValueCents,
    totalValueCents,
    unrealizedPnlCents: holdingsValueCents - investedCents,
    realizedPnlCents,
    totalReturnCents: totalValueCents - STARTING_CASH_CENTS,
    totalReturnPercent: computeReturnPercent(totalValueCents, STARTING_CASH_CENTS),
    startingCashCents: STARTING_CASH_CENTS,
    holdings: views,
    quotesStale,
  };
}

export async function getTransactionHistory(userId: string, limit = 50, before?: Date) {
  const where = before
    ? and(eq(transactions.userId, userId), lt(transactions.createdAt, before))
    : eq(transactions.userId, userId);

  const rows = await db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(desc(transactions.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : null };
}

export async function getWatchlist(userId: string) {
  const rows = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, userId))
    .orderBy(desc(watchlistItems.createdAt));

  const symbols = rows.map((r) => r.symbol).filter(isSupportedSymbol);
  const quotes = symbols.length ? await getQuotes(symbols) : ({} as Record<StockSymbol, Quote | null>);

  return rows.map((row) => ({
    symbol: row.symbol as StockSymbol,
    addedAt: row.createdAt,
    quote: quotes[row.symbol as StockSymbol] ?? null,
  }));
}

export async function getWatchlistSymbols(userId: string): Promise<StockSymbol[]> {
  const rows = await db
    .select({ symbol: watchlistItems.symbol })
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, userId));
  return rows.map((r) => r.symbol).filter(isSupportedSymbol);
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalValueCents: number;
  totalReturnPercent: number;
  holdingsCount: number;
}

export async function getLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  const quotes = await getQuotes(SUPPORTED_SYMBOLS);

  const users = await db
    .select({ id: user.id, name: user.name, cashCents: wallets.balanceCents })
    .from(user)
    .innerJoin(wallets, eq(wallets.userId, user.id));

  const allHoldings = await db
    .select({ userId: holdings.userId, symbol: holdings.symbol, quantity: holdings.quantity, avgCostCents: holdings.avgCostCents })
    .from(holdings);

  const byUser = new Map<string, { valueCents: number; count: number }>();
  for (const h of allHoldings) {
    if (!isSupportedSymbol(h.symbol)) continue;
    const price = quotes[h.symbol]?.priceCents ?? h.avgCostCents;
    const entry = byUser.get(h.userId) ?? { valueCents: 0, count: 0 };
    entry.valueCents += h.quantity * price;
    entry.count += 1;
    byUser.set(h.userId, entry);
  }

  return users
    .map((u) => {
      const agg = byUser.get(u.id) ?? { valueCents: 0, count: 0 };
      const totalValueCents = u.cashCents + agg.valueCents;
      return {
        userId: u.id,
        name: u.name,
        totalValueCents,
        totalReturnPercent: computeReturnPercent(totalValueCents, STARTING_CASH_CENTS),
        holdingsCount: agg.count,
      };
    })
    .sort((a, b) => b.totalValueCents - a.totalValueCents)
    .slice(0, limit)
    .map((entry, i) => ({ rank: i + 1, ...entry }));
}
