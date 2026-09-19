import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { holdings, transactions, user, wallets } from "@/lib/db/schema";
import { STARTING_CASH_CENTS } from "@/lib/trading/constants";

const DEMO = { name: "Demo Trader", email: "demo@fauxfinance.local", password: "demo-password-123" };

// Sample fills at plausible prices so the dashboard isn't empty on first run.
const SAMPLE_BUYS = [
  { symbol: "AAPL", quantity: 10, priceCents: 18_300 },
  { symbol: "TSLA", quantity: 5, priceCents: 16_847 },
  { symbol: "NVDA", quantity: 2, priceCents: 92_479 },
] as const;

async function main() {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO.email));
  if (existing) {
    console.log(`Demo user already exists (${DEMO.email}); nothing to do.`);
    return;
  }

  // Go through Better Auth so the password is hashed exactly as production sign-ups are.
  const created = await auth.api.signUpEmail({ body: DEMO });
  const userId = created.user.id;

  await db.transaction(async (tx) => {
    let cash = STARTING_CASH_CENTS;
    for (const buy of SAMPLE_BUYS) {
      const total = buy.quantity * buy.priceCents;
      cash -= total;
      await tx.insert(holdings).values({ userId, symbol: buy.symbol, quantity: buy.quantity, avgCostCents: buy.priceCents });
      await tx.insert(transactions).values({
        userId,
        symbol: buy.symbol,
        side: "BUY",
        quantity: buy.quantity,
        priceCents: buy.priceCents,
        totalCents: total,
        realizedPnlCents: null,
        cashBalanceAfterCents: cash,
      });
    }
    await tx.update(wallets).set({ balanceCents: cash }).where(eq(wallets.userId, userId));
  });

  console.log(`Seeded demo account.\n  email:    ${DEMO.email}\n  password: ${DEMO.password}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
