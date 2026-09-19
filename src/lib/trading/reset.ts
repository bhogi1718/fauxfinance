import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { holdings, portfolioSnapshots, transactions, wallets, watchlistItems } from "@/lib/db/schema";
import { STARTING_CASH_CENTS } from "./constants";

// Wipes a user's trading state back to a fresh account. Watchlist is kept — it's
// preference, not performance.
export async function resetPortfolio(userId: string) {
  await db.transaction(async (tx) => {
    await tx
      .insert(wallets)
      .values({ userId, balanceCents: STARTING_CASH_CENTS })
      .onConflictDoUpdate({ target: wallets.userId, set: { balanceCents: STARTING_CASH_CENTS } });
    await tx.delete(holdings).where(eq(holdings.userId, userId));
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    await tx.delete(portfolioSnapshots).where(eq(portfolioSnapshots.userId, userId));
  });
}

export async function clearWatchlist(userId: string) {
  await db.delete(watchlistItems).where(eq(watchlistItems.userId, userId));
}
