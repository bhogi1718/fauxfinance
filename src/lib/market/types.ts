import type { StockSymbol } from "@/lib/trading/constants";

export interface Quote {
  symbol: StockSymbol;
  name: string;
  priceCents: number;
  changeCents: number;
  changePercent: number;
  previousCloseCents: number;
  dayHighCents: number;
  dayLowCents: number;
  // Unix ms of the last trade; used to flag stale/closed-market data.
  lastTradeAt: number;
  fetchedAt: number;
}

// Decimal prices as market data APIs report them; converted to cents by the quote service.
export interface RawQuote {
  price: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  lastTradeAt: number; // unix ms
}

export interface MarketDataProvider {
  readonly name: string;
  fetchQuote(symbol: StockSymbol): Promise<RawQuote>;
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}
