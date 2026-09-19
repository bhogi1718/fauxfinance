import type { Metadata } from "next";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { requireUser } from "@/lib/auth/session";
import { getPortfolio } from "@/lib/trading/portfolio";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await requireUser("/portfolio");
  const portfolio = await getPortfolio(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Every position, marked to the latest price.</p>
      </div>
      <PortfolioSummary initialData={portfolio} />
      <HoldingsTable initialData={portfolio} />
    </div>
  );
}
