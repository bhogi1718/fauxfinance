import type { StockSymbol } from "@/lib/trading/constants";
import type { MarketDataProvider, RawQuote } from "../types";

// Deterministic simulated market for local development and tests. Each symbol
// follows a smooth intraday curve plus per-minute noise, so prices move over time
// but the same minute always yields the same price (no test flakiness).

const BASE_PRICES: Record<StockSymbol, number> = {
  AAPL: 228.5,
  TSLA: 251.3,
  UBER: 74.2,
  AMZN: 201.9,
  GOOGL: 176.4,
  MSFT: 431.6,
  NVDA: 135.8,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Uniform in [-1, 1], deterministic for (symbol, bucket).
function noise(symbol: string, bucket: number): number {
  const h = hash(`${symbol}:${bucket}`);
  return (h / 0xffffffff) * 2 - 1;
}

export function simulatePrice(symbol: StockSymbol, at: number): RawQuote {
  const base = BASE_PRICES[symbol];
  const phase = (hash(symbol) % 1000) / 1000;
  const dayIndex = Math.floor(at / DAY_MS);
  const minuteOfDay = (at % DAY_MS) / MINUTE_MS;
  const minuteBucket = Math.floor(at / MINUTE_MS);

  // Previous close drifts a little each day so multi-day history isn't flat.
  const previousClose = base * (1 + 0.03 * noise(symbol, dayIndex - 1));

  const intraday = 0.015 * Math.sin((minuteOfDay / 1440) * Math.PI * 2 + phase * Math.PI * 2);
  const jitter = 0.004 * noise(symbol, minuteBucket);
  const price = previousClose * (1 + intraday + jitter);

  const spread = previousClose * 0.02;
  return {
    price: round2(price),
    previousClose: round2(previousClose),
    dayHigh: round2(Math.max(price, previousClose) + spread * 0.5),
    dayLow: round2(Math.min(price, previousClose) - spread * 0.5),
    lastTradeAt: minuteBucket * MINUTE_MS,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function createMockProvider(clock: () => number = Date.now): MarketDataProvider {
  return {
    name: "mock",
    async fetchQuote(symbol) {
      return simulatePrice(symbol, clock());
    },
  };
}
