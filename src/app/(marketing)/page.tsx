import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Trophy, Wallet } from "lucide-react";
import { StockCard } from "@/components/stocks/stock-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { getQuotes } from "@/lib/finnhub/quotes";
import { formatCents } from "@/lib/format";
import { STARTING_CASH_CENTS, STOCKS, SUPPORTED_SYMBOLS } from "@/lib/trading/constants";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Wallet,
    title: `${formatCents(STARTING_CASH_CENTS, { compact: true })} to start`,
    body: "Every account opens with virtual cash. Spend it, lose it, grow it — none of it is real.",
  },
  {
    icon: BarChart3,
    title: "Real market prices",
    body: "Orders fill at live US stock quotes, with full TradingView charts, technicals and financials.",
  },
  {
    icon: ShieldCheck,
    title: "Honest bookkeeping",
    body: "Weighted average cost, realized and unrealized P&L, and an immutable trade ledger.",
  },
  {
    icon: Trophy,
    title: "Compete",
    body: "A public leaderboard ranks every trader by total portfolio value.",
  },
];

export default async function LandingPage() {
  const [user, quotes] = await Promise.all([getSessionUser(), getQuotes(SUPPORTED_SYMBOLS)]);
  const featured = SUPPORTED_SYMBOLS.slice(0, 4);
  const cta = user ? { href: "/dashboard", label: "Open dashboard" } : { href: "/signup", label: "Start trading free" };

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="flex flex-col items-center py-20 text-center md:py-28">
        <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Paper trading · US stocks
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          Learn to trade with real prices and fake money.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
          FauxFinance gives you {formatCents(STARTING_CASH_CENTS)} in virtual cash and a live market to practice in.
          Build a portfolio, track your P&amp;L, and see how you stack up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href={cta.href} />}>
            {cta.label} <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/explore" />}>
            Browse the market
          </Button>
        </div>
      </section>

      <section aria-labelledby="market-heading" className="pb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="market-heading" className="text-lg font-medium">
            Live now
          </h2>
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
            All {SUPPORTED_SYMBOLS.length} stocks →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {featured.map((symbol) => (
            <StockCard key={symbol} symbol={symbol} name={STOCKS[symbol].name} sector={STOCKS[symbol].sector} quote={quotes[symbol]} />
          ))}
        </div>
      </section>

      <section aria-labelledby="features-heading" className="pb-24">
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="gap-3 p-5">
              <Icon className="size-5 text-brand" aria-hidden />
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
