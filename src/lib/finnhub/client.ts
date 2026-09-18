import "server-only";
import { env } from "@/lib/env";

const BASE_URL = "https://finnhub.io/api/v1";

export interface FinnhubQuote {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // percent change
  h: number; // day high
  l: number; // day low
  o: number; // day open
  pc: number; // previous close
  t: number; // unix seconds of last trade
}

export class FinnhubError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "FinnhubError";
  }
}

export async function fetchQuote(symbol: string): Promise<FinnhubQuote> {
  const url = new URL(`${BASE_URL}/quote`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", env.FINNHUB_API_KEY);

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!res.ok) {
    throw new FinnhubError(`Finnhub responded ${res.status} for ${symbol}`, res.status);
  }

  const data = (await res.json()) as FinnhubQuote;
  // Finnhub returns all zeros for unknown symbols instead of a 404.
  if (!data || typeof data.c !== "number" || data.c <= 0) {
    throw new FinnhubError(`Finnhub returned no price for ${symbol}`);
  }
  return data;
}
