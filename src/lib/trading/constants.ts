export const STARTING_CASH_CENTS = 10_000_000; // $100,000.00

export const STOCKS = {
  AAPL: { name: "Apple Inc.", tradingView: "NASDAQ:AAPL", sector: "Technology" },
  TSLA: { name: "Tesla, Inc.", tradingView: "NASDAQ:TSLA", sector: "Automotive" },
  UBER: { name: "Uber Technologies, Inc.", tradingView: "NYSE:UBER", sector: "Transportation" },
  AMZN: { name: "Amazon.com, Inc.", tradingView: "NASDAQ:AMZN", sector: "Consumer" },
  GOOGL: { name: "Alphabet Inc.", tradingView: "NASDAQ:GOOGL", sector: "Technology" },
  MSFT: { name: "Microsoft Corporation", tradingView: "NASDAQ:MSFT", sector: "Technology" },
  NVDA: { name: "NVIDIA Corporation", tradingView: "NASDAQ:NVDA", sector: "Semiconductors" },
} as const;

export type Symbol = keyof typeof STOCKS;
export const SUPPORTED_SYMBOLS = Object.keys(STOCKS) as Symbol[];

export function isSupportedSymbol(value: string): value is Symbol {
  return value in STOCKS;
}

export const ORDER_SIDES = ["BUY", "SELL"] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];
