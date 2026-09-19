import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// All monetary values are integer cents. Never store floats for money.
const cents = (name: string) => bigint(name, { mode: "number" });

export const orderSide = pgEnum("order_side", ["BUY", "SELL"]);

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  balanceCents: cents("balance_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const holdings = pgTable(
  "holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    quantity: integer("quantity").notNull(),
    avgCostCents: cents("avg_cost_cents").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("holdings_user_symbol_unique").on(t.userId, t.symbol)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    side: orderSide("side").notNull(),
    quantity: integer("quantity").notNull(),
    priceCents: cents("price_cents").notNull(),
    totalCents: cents("total_cents").notNull(),
    realizedPnlCents: cents("realized_pnl_cents"),
    cashBalanceAfterCents: cents("cash_balance_after_cents").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("transactions_user_created_idx").on(t.userId, t.createdAt)],
);

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("watchlist_user_symbol_unique").on(t.userId, t.symbol)],
);

// Point-in-time portfolio valuations, written after every order and at most once an
// hour on read, so the dashboard can chart performance without a background job.
export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    totalValueCents: cents("total_value_cents").notNull(),
    cashCents: cents("cash_cents").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("portfolio_snapshots_user_created_idx").on(t.userId, t.createdAt)],
);

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(user, { fields: [wallets.userId], references: [user.id] }),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  user: one(user, { fields: [holdings.userId], references: [user.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(user, { fields: [transactions.userId], references: [user.id] }),
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(user, { fields: [watchlistItems.userId], references: [user.id] }),
}));

export type Wallet = typeof wallets.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
