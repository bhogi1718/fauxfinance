import type { Metadata } from "next";
import { HistoryTable } from "@/components/portfolio/history-table";
import { requireUser } from "@/lib/auth/session";
import { getTransactionHistory } from "@/lib/trading/portfolio";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser("/history");
  const history = await getTransactionHistory(user.id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trade history</h1>
        <p className="text-sm text-muted-foreground">An immutable record of every order you&apos;ve placed.</p>
      </div>
      <HistoryTable initialData={history} />
    </div>
  );
}
