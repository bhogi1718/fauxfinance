import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { StockList } from "@/components/stocks/stock-list";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { getPortfolio } from "@/lib/trading/portfolio";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const portfolio = await getPortfolio(user.id);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s how your portfolio is doing.</p>
      </div>

      <PortfolioSummary initialData={portfolio} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <HoldingsTable initialData={portfolio} compact />
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Market movers</h2>
            <Button variant="ghost" size="sm" render={<Link href="/explore" />}>
              Explore all <ArrowRight />
            </Button>
          </div>
          <StockList limit={4} />
        </section>
      </div>
    </div>
  );
}
