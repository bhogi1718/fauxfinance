import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { portfolioSnapshots, user } from "@/lib/db/schema";
import { STARTING_CASH_CENTS } from "./constants";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type PerformanceRange = "1D" | "1W" | "1M" | "ALL";
export const PERFORMANCE_RANGES: PerformanceRange[] = ["1D", "1W", "1M", "ALL"];

const RANGE_MS: Record<PerformanceRange, number | null> = {
  "1D": DAY_MS,
  "1W": 7 * DAY_MS,
  "1M": 30 * DAY_MS,
  ALL: null,
};

export interface PerformancePoint {
  at: string; // ISO
  totalValueCents: number;
  cashCents: number;
}

export async function recordSnapshot(userId: string, totalValueCents: number, cashCents: number) {
  await db.insert(portfolioSnapshots).values({ userId, totalValueCents, cashCents });
}

// Called on portfolio reads: writes at most one snapshot per hour per user so the
// chart keeps filling in even when the user isn't trading.
export async function maybeRecordSnapshot(userId: string, totalValueCents: number, cashCents: number) {
  const [latest] = await db
    .select({ createdAt: portfolioSnapshots.createdAt })
    .from(portfolioSnapshots)
    .where(eq(portfolioSnapshots.userId, userId))
    .orderBy(desc(portfolioSnapshots.createdAt))
    .limit(1);

  if (!latest || Date.now() - latest.createdAt.getTime() >= HOUR_MS) {
    await recordSnapshot(userId, totalValueCents, cashCents);
  }
}

export async function getPerformance(
  userId: string,
  range: PerformanceRange,
  current: { totalValueCents: number; cashCents: number },
): Promise<PerformancePoint[]> {
  const span = RANGE_MS[range];
  const since = span ? new Date(Date.now() - span) : null;

  const [account] = await db.select({ createdAt: user.createdAt }).from(user).where(eq(user.id, userId));
  const rows = await db
    .select({
      at: portfolioSnapshots.createdAt,
      totalValueCents: portfolioSnapshots.totalValueCents,
      cashCents: portfolioSnapshots.cashCents,
    })
    .from(portfolioSnapshots)
    .where(since ? and(eq(portfolioSnapshots.userId, userId), gte(portfolioSnapshots.createdAt, since)) : eq(portfolioSnapshots.userId, userId))
    .orderBy(portfolioSnapshots.createdAt);

  const points: PerformancePoint[] = rows.map((r) => ({
    at: r.at.toISOString(),
    totalValueCents: r.totalValueCents,
    cashCents: r.cashCents,
  }));

  // Anchor the series at the account's starting balance so returns read from a baseline.
  const start = account?.createdAt ?? new Date();
  if (!since || start >= since) {
    points.unshift({ at: start.toISOString(), totalValueCents: STARTING_CASH_CENTS, cashCents: STARTING_CASH_CENTS });
  } else if (points.length === 0 || new Date(points[0].at) > since) {
    // Carry the last known value before the window into the window's start.
    const [prior] = await db
      .select({ totalValueCents: portfolioSnapshots.totalValueCents, cashCents: portfolioSnapshots.cashCents })
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.userId, userId))
      .orderBy(desc(portfolioSnapshots.createdAt))
      .limit(1);
    const carried = prior ?? { totalValueCents: STARTING_CASH_CENTS, cashCents: STARTING_CASH_CENTS };
    points.unshift({ at: since.toISOString(), ...carried });
  }

  // Always end at "now" with the live valuation.
  points.push({ at: new Date().toISOString(), ...current });
  return points;
}
