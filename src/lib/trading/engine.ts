import "server-only";
import { and, eq } from "drizzle-orm";
import { db, type Tx } from "@/lib/db";
import { holdings, transactions, wallets, type Transaction } from "@/lib/db/schema";
import { getQuote } from "@/lib/market/quotes";
import { MarketDataError } from "@/lib/market/types";
import { STARTING_CASH_CENTS, type OrderSide, type StockSymbol } from "./constants";
import { InsufficientFundsError, InsufficientSharesError, QuoteUnavailableError } from "./errors";
import {
  canAfford,
  canSell,
  computeNewAverageCost,
  computeOrderTotalCents,
  computeRealizedPnlCents,
} from "./math";

export interface PlaceOrderInput {
  userId: string;
  symbol: StockSymbol;
  side: OrderSide;
  quantity: number;
}

export interface PlaceOrderResult {
  transaction: Transaction;
  balanceCents: number;
  holding: { symbol: StockSymbol; quantity: number; avgCostCents: number } | null;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const quote = await getQuote(input.symbol).catch((err: unknown) => {
    if (err instanceof MarketDataError) throw new QuoteUnavailableError(input.symbol);
    throw err;
  });

  return input.side === "BUY"
    ? executeBuy(input, quote.priceCents)
    : executeSell(input, quote.priceCents);
}

async function executeBuy(
  { userId, symbol, quantity }: PlaceOrderInput,
  priceCents: number,
): Promise<PlaceOrderResult> {
  const totalCents = computeOrderTotalCents(quantity, priceCents);

  return db.transaction(async (tx) => {
    const wallet = await lockWallet(tx, userId);
    if (!canAfford(wallet.balanceCents, totalCents)) {
      throw new InsufficientFundsError(totalCents, wallet.balanceCents);
    }

    const newBalance = wallet.balanceCents - totalCents;
    await tx.update(wallets).set({ balanceCents: newBalance }).where(eq(wallets.id, wallet.id));

    const [existing] = await tx
      .select()
      .from(holdings)
      .where(and(eq(holdings.userId, userId), eq(holdings.symbol, symbol)))
      .for("update");

    let newQty: number;
    let newAvg: number;
    if (existing) {
      newQty = existing.quantity + quantity;
      newAvg = computeNewAverageCost(existing.quantity, existing.avgCostCents, quantity, priceCents);
      await tx
        .update(holdings)
        .set({ quantity: newQty, avgCostCents: newAvg })
        .where(eq(holdings.id, existing.id));
    } else {
      newQty = quantity;
      newAvg = priceCents;
      await tx.insert(holdings).values({ userId, symbol, quantity: newQty, avgCostCents: newAvg });
    }

    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        symbol,
        side: "BUY",
        quantity,
        priceCents,
        totalCents,
        realizedPnlCents: null,
        cashBalanceAfterCents: newBalance,
      })
      .returning();

    return {
      transaction,
      balanceCents: newBalance,
      holding: { symbol, quantity: newQty, avgCostCents: newAvg },
    };
  });
}

async function executeSell(
  { userId, symbol, quantity }: PlaceOrderInput,
  priceCents: number,
): Promise<PlaceOrderResult> {
  const proceedsCents = computeOrderTotalCents(quantity, priceCents);

  return db.transaction(async (tx) => {
    // Always lock wallet before holding (same order as executeBuy) so concurrent
    // buy/sell requests for one user serialize instead of deadlocking.
    const wallet = await lockWallet(tx, userId);

    const [existing] = await tx
      .select()
      .from(holdings)
      .where(and(eq(holdings.userId, userId), eq(holdings.symbol, symbol)))
      .for("update");

    const owned = existing?.quantity ?? 0;
    if (!existing || !canSell(owned, quantity)) {
      throw new InsufficientSharesError(symbol, quantity, owned);
    }

    const realizedPnlCents = computeRealizedPnlCents(quantity, priceCents, existing.avgCostCents);
    const remainingQty = existing.quantity - quantity;

    if (remainingQty === 0) {
      await tx.delete(holdings).where(eq(holdings.id, existing.id));
    } else {
      // Selling never changes the average cost of the shares that remain.
      await tx.update(holdings).set({ quantity: remainingQty }).where(eq(holdings.id, existing.id));
    }

    const newBalance = wallet.balanceCents + proceedsCents;
    await tx.update(wallets).set({ balanceCents: newBalance }).where(eq(wallets.id, wallet.id));

    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        symbol,
        side: "SELL",
        quantity,
        priceCents,
        totalCents: proceedsCents,
        realizedPnlCents,
        cashBalanceAfterCents: newBalance,
      })
      .returning();

    return {
      transaction,
      balanceCents: newBalance,
      holding:
        remainingQty === 0
          ? null
          : { symbol, quantity: remainingQty, avgCostCents: existing.avgCostCents },
    };
  });
}

// Locks the user's wallet row for the duration of the transaction, creating it if the
// signup hook somehow didn't (defensive: a user must never be left without a wallet).
async function lockWallet(tx: Tx, userId: string) {
  await tx
    .insert(wallets)
    .values({ userId, balanceCents: STARTING_CASH_CENTS })
    .onConflictDoNothing({ target: wallets.userId });

  const [wallet] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .for("update");

  if (!wallet) throw new Error(`Wallet missing for user ${userId}`);
  return wallet;
}

export async function ensureWallet(userId: string) {
  await db
    .insert(wallets)
    .values({ userId, balanceCents: STARTING_CASH_CENTS })
    .onConflictDoNothing({ target: wallets.userId });
}
