import type { Metadata } from "next";
import { StockList } from "@/components/stocks/stock-list";
import type { StockListing } from "@/hooks/use-market";
import { getQuotes } from "@/lib/finnhub/quotes";
import { STOCKS, SUPPORTED_SYMBOLS } from "@/lib/trading/constants";

export const metadata: Metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const quotes = await getQuotes(SUPPORTED_SYMBOLS);
  const initialData: StockListing[] = SUPPORTED_SYMBOLS.map((symbol) => ({
    symbol,
    ...STOCKS[symbol],
    quote: quotes[symbol],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground">
          {SUPPORTED_SYMBOLS.length} US stocks available to trade. Prices refresh every 15 seconds.
        </p>
      </div>
      <StockList initialData={initialData} />
    </div>
  );
}
