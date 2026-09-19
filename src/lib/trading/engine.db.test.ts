import { and, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Quote } from "@/lib/market/types";
import type { StockSymbol } from "./constants";

// Control prices per test instead of hitting a market data provider.
const prices = new Map<StockSymbol, number>();
vi.mock("@/lib/market/quotes", () => ({
  getQuote: vi.fn(async (symbol: StockSymbol): Promise<Quote> => {
    const priceCents = prices.get(symbol);
    if (priceCents === undefined) throw new Error(`no test price for ${symbol}`);
    return {
      symbol,
      name: symbol,
      priceCents,
      changeCents: 0,
      changePercent: 0,
      previousCloseCents: priceCents,
      dayHighCents: priceCents,
      dayLowCents: priceCents,
      lastTradeAt: Date.now(),
      fetchedAt: Date.now(),
    };
  }),
  getQuotes: vi.fn(),
}));

const { db } = await import("@/lib/db");
const { holdings, transactions, user, wallets } = await import("@/lib/db/schema");
const { STARTING_CASH_CENTS } = await import("./constants");
const { placeOrder } = await import("./engine");
const { InsufficientFundsError, InsufficientSharesError } = await import("./errors");

let userId: string;

async function createUser() {
  const id = `test-${crypto.randomUUID()}`;
  await db.insert(user).values({ id, name: "Test Trader", email: `${id}@test.local` });
  await db.insert(wallets).values({ userId: id, balanceCents: STARTING_CASH_CENTS });
  return id;
}

async function wallet(id = userId) {
  const [w] = await db.select().from(wallets).where(eq(wallets.userId, id));
  return w;
}

async function holding(symbol: StockSymbol, id = userId) {
  const [h] = await db
    .select()
    .from(holdings)
    .where(and(eq(holdings.userId, id), eq(holdings.symbol, symbol)));
  return h ?? null;
}

async function ledger(id = userId) {
  return db.select().from(transactions).where(eq(transactions.userId, id)).orderBy(transactions.createdAt);
}

beforeEach(async () => {
  prices.clear();
  userId = await createUser();
});

afterAll(async () => {
  // Cascades to wallets/holdings/transactions.
  const rows = await db.select({ id: user.id }).from(user);
  for (const r of rows) if (r.id.startsWith("test-")) await db.delete(user).where(eq(user.id, r.id));
});

describe("placeOrder — buy", () => {
  it("debits cash, opens a position, and writes a ledger row", async () => {
    prices.set("AAPL", 15_000);
    const result = await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 5 });

    expect(result.balanceCents).toBe(STARTING_CASH_CENTS - 75_000);
    expect(result.holding).toEqual({ symbol: "AAPL", quantity: 5, avgCostCents: 15_000 });

    expect((await wallet()).balanceCents).toBe(STARTING_CASH_CENTS - 75_000);
    expect(await holding("AAPL")).toMatchObject({ quantity: 5, avgCostCents: 15_000 });

    const rows = await ledger();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      side: "BUY",
      quantity: 5,
      priceCents: 15_000,
      totalCents: 75_000,
      realizedPnlCents: null,
      cashBalanceAfterCents: STARTING_CASH_CENTS - 75_000,
    });
  });

  it("recomputes the weighted average cost on a second buy", async () => {
    prices.set("AAPL", 15_000);
    await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 5 });
    prices.set("AAPL", 17_000);
    const result = await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 5 });

    expect(result.holding).toEqual({ symbol: "AAPL", quantity: 10, avgCostCents: 16_000 });
    expect(await holding("AAPL")).toMatchObject({ quantity: 10, avgCostCents: 16_000 });
  });

  it("rejects an order the wallet can't cover and changes nothing", async () => {
    prices.set("NVDA", 100_000);
    await expect(placeOrder({ userId, symbol: "NVDA", side: "BUY", quantity: 101 })).rejects.toBeInstanceOf(
      InsufficientFundsError,
    );

    expect((await wallet()).balanceCents).toBe(STARTING_CASH_CENTS);
    expect(await holding("NVDA")).toBeNull();
    expect(await ledger()).toHaveLength(0);
  });

  it("allows spending the wallet down to exactly zero", async () => {
    prices.set("NVDA", 100_000);
    await placeOrder({ userId, symbol: "NVDA", side: "BUY", quantity: 100 });
    expect((await wallet()).balanceCents).toBe(0);
  });
});

describe("placeOrder — sell", () => {
  it("credits proceeds, records realized P&L, and keeps the remaining cost basis", async () => {
    prices.set("AAPL", 15_000);
    await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 5 });
    prices.set("AAPL", 17_000);
    await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 5 });

    prices.set("AAPL", 20_000);
    const result = await placeOrder({ userId, symbol: "AAPL", side: "SELL", quantity: 4 });

    // (200 - 160) * 4 = $160 realized
    expect(result.transaction.realizedPnlCents).toBe(16_000);
    expect(result.holding).toEqual({ symbol: "AAPL", quantity: 6, avgCostCents: 16_000 });
    expect(result.balanceCents).toBe(STARTING_CASH_CENTS - 75_000 - 85_000 + 80_000);
    expect(await holding("AAPL")).toMatchObject({ quantity: 6, avgCostCents: 16_000 });
  });

  it("removes the holding row when the whole position is sold", async () => {
    prices.set("TSLA", 20_000);
    await placeOrder({ userId, symbol: "TSLA", side: "BUY", quantity: 3 });
    prices.set("TSLA", 18_000);
    const result = await placeOrder({ userId, symbol: "TSLA", side: "SELL", quantity: 3 });

    expect(result.holding).toBeNull();
    expect(result.transaction.realizedPnlCents).toBe(-6_000);
    expect(await holding("TSLA")).toBeNull();
    expect((await wallet()).balanceCents).toBe(STARTING_CASH_CENTS - 6_000);
  });

  it("rejects overselling and selling a symbol never owned, without side effects", async () => {
    prices.set("AAPL", 15_000);
    await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 2 });

    await expect(placeOrder({ userId, symbol: "AAPL", side: "SELL", quantity: 3 })).rejects.toBeInstanceOf(
      InsufficientSharesError,
    );
    prices.set("MSFT", 40_000);
    await expect(placeOrder({ userId, symbol: "MSFT", side: "SELL", quantity: 1 })).rejects.toBeInstanceOf(
      InsufficientSharesError,
    );

    expect(await holding("AAPL")).toMatchObject({ quantity: 2 });
    expect(await ledger()).toHaveLength(1);
  });
});

describe("placeOrder — concurrency", () => {
  it("never overspends when many buys race for the same wallet", async () => {
    prices.set("AAPL", 3_000_000); // $30,000 per share: only 3 fit in $100,000
    const attempts = Array.from({ length: 8 }, () =>
      placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 1 }).then(
        () => "ok" as const,
        (e: unknown) => (e instanceof InsufficientFundsError ? ("rejected" as const) : Promise.reject(e)),
      ),
    );
    const outcomes = await Promise.all(attempts);

    expect(outcomes.filter((o) => o === "ok")).toHaveLength(3);
    expect(outcomes.filter((o) => o === "rejected")).toHaveLength(5);
    expect((await wallet()).balanceCents).toBe(STARTING_CASH_CENTS - 9_000_000);
    expect(await holding("AAPL")).toMatchObject({ quantity: 3 });
    expect(await ledger()).toHaveLength(3);
  });

  it("serializes interleaved buys and sells without deadlocking", async () => {
    prices.set("AAPL", 10_000);
    await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 10 });

    const ops = [
      placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 2 }),
      placeOrder({ userId, symbol: "AAPL", side: "SELL", quantity: 3 }),
      placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 1 }),
      placeOrder({ userId, symbol: "AAPL", side: "SELL", quantity: 2 }),
      placeOrder({ userId, symbol: "AAPL", side: "SELL", quantity: 1 }),
    ];
    await expect(Promise.all(ops)).resolves.toHaveLength(5);

    // 10 + 2 - 3 + 1 - 2 - 1 = 7 shares; cash moved by (-3 + 6 - 1) shares * $100
    expect(await holding("AAPL")).toMatchObject({ quantity: 7, avgCostCents: 10_000 });
    expect((await wallet()).balanceCents).toBe(STARTING_CASH_CENTS - 7 * 10_000);
    expect(await ledger()).toHaveLength(6);
  });

  it("keeps users isolated from each other", async () => {
    const other = await createUser();
    prices.set("AAPL", 10_000);
    await placeOrder({ userId, symbol: "AAPL", side: "BUY", quantity: 4 });

    await expect(placeOrder({ userId: other, symbol: "AAPL", side: "SELL", quantity: 1 })).rejects.toBeInstanceOf(
      InsufficientSharesError,
    );
    expect((await wallet(other)).balanceCents).toBe(STARTING_CASH_CENTS);
    expect(await holding("AAPL", other)).toBeNull();
  });
});
