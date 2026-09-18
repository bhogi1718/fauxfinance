import "server-only";
import { env } from "@/lib/env";
import { toCents } from "@/lib/trading/math";
import { type Symbol, STOCKS } from "@/lib/trading/constants";
import { TtlCache } from "./cache";
import { fetchQuote, FinnhubError } from "./client";

export interface Quote {
  symbol: Symbol;
  name: string;
  priceCents: number;
  changeCents: number;
  changePercent: number;
  previousCloseCents: number;
  dayHighCents: number;
  dayLowCents: number;
  // Unix ms of the last trade Finnhub knows about; used to flag stale/closed-market data.
  lastTradeAt: number;
  fetchedAt: number;
}

const cache = new TtlCache<Quote>(env.QUOTE_CACHE_TTL_MS);

export async function getQuote(symbol: Symbol): Promise<Quote> {
  try {
    return await cache.getOrLoad(symbol, async () => {
      const raw = await fetchQuote(symbol);
      return {
        symbol,
        name: STOCKS[symbol].name,
        priceCents: toCents(raw.c),
        changeCents: toCents(raw.d ?? raw.c - raw.pc),
        changePercent: raw.dp ?? ((raw.c - raw.pc) / raw.pc) * 100,
        previousCloseCents: toCents(raw.pc),
        dayHighCents: toCents(raw.h),
        dayLowCents: toCents(raw.l),
        lastTradeAt: raw.t * 1000,
        fetchedAt: Date.now(),
      };
    });
  } catch (error) {
    const stale = cache.peekStale(symbol);
    if (stale) {
      console.warn(`[finnhub] serving stale quote for ${symbol}:`, (error as Error).message);
      return stale;
    }
    if (error instanceof FinnhubError) throw error;
    throw new FinnhubError(`Failed to load quote for ${symbol}`);
  }
}

export async function getQuotes(symbols: Symbol[]): Promise<Record<Symbol, Quote | null>> {
  const results = await Promise.allSettled(symbols.map((s) => getQuote(s)));
  const out = {} as Record<Symbol, Quote | null>;
  symbols.forEach((symbol, i) => {
    const r = results[i];
    out[symbol] = r.status === "fulfilled" ? r.value : null;
  });
  return out;
}
