import "server-only";
import type { StockSymbol } from "@/lib/trading/constants";
import { MarketDataError, type MarketDataProvider, type RawQuote } from "../types";

const BASE_URL = "https://finnhub.io/api/v1";

interface FinnhubQuoteResponse {
  c: number; // current price
  h: number; // day high
  l: number; // day low
  pc: number; // previous close
  t: number; // unix seconds of last trade
}

export function createFinnhubProvider(apiKey: string): MarketDataProvider {
  return {
    name: "finnhub",
    async fetchQuote(symbol: StockSymbol): Promise<RawQuote> {
      const url = new URL(`${BASE_URL}/quote`);
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("token", apiKey);

      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
      if (res.status === 429) throw new MarketDataError("Finnhub rate limit exceeded", 429);
      if (!res.ok) throw new MarketDataError(`Finnhub responded ${res.status} for ${symbol}`, res.status);

      const data = (await res.json()) as FinnhubQuoteResponse;
      // Finnhub returns all zeros for unknown symbols instead of a 404.
      if (!data || typeof data.c !== "number" || data.c <= 0) {
        throw new MarketDataError(`Finnhub returned no price for ${symbol}`);
      }

      return {
        price: data.c,
        previousClose: data.pc > 0 ? data.pc : data.c,
        dayHigh: data.h > 0 ? data.h : data.c,
        dayLow: data.l > 0 ? data.l : data.c,
        lastTradeAt: data.t * 1000,
      };
    },
  };
}
