import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketStatus } from "@/components/stocks/market-status";
import { PriceChange } from "@/components/stocks/price-change";
import { TradePanel } from "@/components/stocks/trade-panel";
import { TradingViewWidget } from "@/components/stocks/tradingview-widget";
import { WatchlistToggle } from "@/components/watchlist/watchlist-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQuote, type Quote } from "@/lib/finnhub/quotes";
import { formatCents } from "@/lib/format";
import { STOCKS, SUPPORTED_SYMBOLS, isSupportedSymbol } from "@/lib/trading/constants";

type Params = Promise<{ symbol: string }>;

export function generateStaticParams() {
  return SUPPORTED_SYMBOLS.map((symbol) => ({ symbol: symbol.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const raw = (await params).symbol.toUpperCase();
  return { title: isSupportedSymbol(raw) ? `${raw} · ${STOCKS[raw].name}` : "Stock not found" };
}

export default async function StockPage({ params }: { params: Params }) {
  const raw = (await params).symbol.toUpperCase();
  if (!isSupportedSymbol(raw)) notFound();
  const symbol = raw;
  const meta = STOCKS[symbol];

  let quote: Quote | null = null;
  try {
    quote = await getQuote(symbol);
  } catch {
    quote = null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{meta.name}</h1>
            <Badge variant="outline">{symbol}</Badge>
            <WatchlistToggle symbol={symbol} />
          </div>
          <p className="text-sm text-muted-foreground">{meta.sector} · {meta.tradingView}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-baseline gap-3">
            <span className="tabular text-3xl font-semibold">{quote ? formatCents(quote.priceCents) : "—"}</span>
            {quote && <PriceChange changeCents={quote.changeCents} changePercent={quote.changePercent} />}
          </div>
          <MarketStatus lastTradeAt={quote?.lastTradeAt} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <TradingViewWidget widget="advanced-chart" symbol={meta.tradingView} height={520} />
          </Card>

          {quote && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Open / Prev close" value={formatCents(quote.previousCloseCents)} />
              <Stat label="Day high" value={formatCents(quote.dayHighCents)} />
              <Stat label="Day low" value={formatCents(quote.dayLowCents)} />
              <Stat label="Change" value={<PriceChange changeCents={quote.changeCents} showIcon={false} />} />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Research</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="technicals">
                <TabsList>
                  <TabsTrigger value="technicals">Technicals</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>
                <TabsContent value="technicals" className="pt-4">
                  <TradingViewWidget widget="technical-analysis" symbol={meta.tradingView} height={450} />
                </TabsContent>
                <TabsContent value="financials" className="pt-4">
                  <TradingViewWidget widget="financials" symbol={meta.tradingView} height={550} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <TradePanel symbol={symbol} initialQuote={quote} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="tabular font-medium">{value}</div>
    </Card>
  );
}
