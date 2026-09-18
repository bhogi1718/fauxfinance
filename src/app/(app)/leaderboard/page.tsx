import type { Metadata } from "next";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { getSessionUser } from "@/lib/auth/session";
import { getLeaderboard } from "@/lib/trading/portfolio";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [user, entries] = await Promise.all([getSessionUser(), getLeaderboard()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Ranked by total portfolio value — cash plus holdings at the latest price.</p>
      </div>
      <LeaderboardTable initialData={entries} currentUserId={user?.id} />
    </div>
  );
}
