import "server-only";
import { env } from "@/lib/env";
import { toCents } from "@/lib/trading/math";
import { STOCKS, type StockSymbol } from "@/lib/trading/constants";
import { TtlCache } from "./cache";
import { createFinnhubProvider } from "./providers/finnhub";
import { createMockProvider } from "./providers/mock";
import { MarketDataError, type MarketDataProvider, type Quote } from "./types";

export type { Quote } from "./types";

function selectProvider(): MarketDataProvider {
  const wantsFinnhub = env.MARKET_DATA_PROVIDER === "finnhub" || (env.MARKET_DATA_PROVIDER === "auto" && env.FINNHUB_API_KEY);
  if (wantsFinnhub) {
    if (!env.FINNHUB_API_KEY) throw new Error("MARKET_DATA_PROVIDER=finnhub requires FINNHUB_API_KEY");
    return createFinnhubProvider(env.FINNHUB_API_KEY);
  }
  if (process.env.NODE_ENV === "production" && env.MARKET_DATA_PROVIDER === "auto") {
    console.warn("[market] No FINNHUB_API_KEY set — serving simulated prices.");
  }
  return createMockProvider();
}

// One provider and one cache per server process (survives Next.js dev HMR).
const g = globalThis as unknown as { marketProvider?: MarketDataProvider; quoteCache?: TtlCache<Quote> };
export const provider = (g.marketProvider ??= selectProvider());
const cache = (g.quoteCache ??= new TtlCache<Quote>(env.QUOTE_CACHE_TTL_MS));

export async function getQuote(symbol: StockSymbol): Promise<Quote> {
  try {
    return await cache.getOrLoad(symbol, async () => {
      const raw = await provider.fetchQuote(symbol);
      const priceCents = toCents(raw.price);
      const previousCloseCents = toCents(raw.previousClose);
      const changeCents = priceCents - previousCloseCents;
      return {
        symbol,
        name: STOCKS[symbol].name,
        priceCents,
        changeCents,
        changePercent: previousCloseCents > 0 ? (changeCents / previousCloseCents) * 100 : 0,
        previousCloseCents,
        dayHighCents: toCents(raw.dayHigh),
        dayLowCents: toCents(raw.dayLow),
        lastTradeAt: raw.lastTradeAt,
        fetchedAt: Date.now(),
      };
    });
  } catch (error) {
    const stale = cache.peekStale(symbol);
    if (stale) {
      console.warn(`[market:${provider.name}] serving stale quote for ${symbol}:`, (error as Error).message);
      return stale;
    }
    if (error instanceof MarketDataError) throw error;
    throw new MarketDataError(`Failed to load quote for ${symbol}`);
  }
}

export async function getQuotes(symbols: StockSymbol[]): Promise<Record<StockSymbol, Quote | null>> {
  const results = await Promise.allSettled(symbols.map((s) => getQuote(s)));
  const out = {} as Record<StockSymbol, Quote | null>;
  symbols.forEach((symbol, i) => {
    const r = results[i];
    out[symbol] = r.status === "fulfilled" ? r.value : null;
  });
  return out;
}
