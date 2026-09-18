import type { Metadata } from "next";
import { WatchlistList } from "@/components/watchlist/watchlist-list";
import { getSessionUser } from "@/lib/auth/session";
import { getWatchlist } from "@/lib/trading/portfolio";

export const metadata: Metadata = { title: "Watchlist" };
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const user = (await getSessionUser())!;
  const items = await getWatchlist(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-sm text-muted-foreground">Stocks you&apos;re keeping an eye on.</p>
      </div>
      <WatchlistList initialData={items.map((i) => ({ ...i, addedAt: i.addedAt.toISOString() }))} />
    </div>
  );
}
