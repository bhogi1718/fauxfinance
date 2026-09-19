# FauxFinance

A paper-trading platform for US stocks. Every account starts with $100,000 in virtual cash; orders fill at live market prices; the money is fake, the bookkeeping is real.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · PostgreSQL (Docker) · Drizzle ORM · Better Auth · Finnhub market data · TradingView charts · TanStack Query · Vitest

## Local setup

Prerequisites: Node 20+, Docker Desktop, a free [Finnhub API key](https://finnhub.io/register).

```bash
npm install
cp .env.example .env          # then set FINNHUB_API_KEY and BETTER_AUTH_SECRET
npm run db:up                 # Postgres on localhost:5433
npm run db:migrate
npm run db:seed               # optional demo account (see output for credentials)
npm run dev                   # http://localhost:3000
```

Generate a secret with `openssl rand -base64 32` (or any 32+ character random string).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run test` | Vitest — trading math and cache |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:generate` | Create a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:seed` | Create the demo account |

## How trading works

- **Money is integer cents.** No floats anywhere in the ledger.
- **Market orders only.** A buy or sell executes immediately at the current cached quote.
- **Atomic execution.** Each order runs in one Postgres transaction with `SELECT … FOR UPDATE` locks on the wallet and holding, so a double-click can't double-spend.
- **Cost basis** is a weighted average, updated on every buy and untouched by sells.
- **Realized P&L** is written to an immutable `transactions` row at sale time; **unrealized P&L** is computed on read from the latest price.
- **Leaderboard** ranks by total portfolio value (cash + holdings at market).

## Project layout

```
src/
  app/            routes — (marketing) public, (auth) login/signup, (app) authenticated
  app/api/        route handlers: auth, stocks, quotes, portfolio, orders, watchlist, leaderboard
  components/     ui/ (shadcn) plus feature components
  hooks/          TanStack Query hooks
  lib/trading/    constants, pure math (+ tests), engine, portfolio queries
  lib/finnhub/    server-only client with TTL cache and in-flight de-dupe
  lib/db/         Drizzle client, schema, seed
  lib/auth/       Better Auth server config, client, session helper
drizzle/          generated SQL migrations
```

## Notes

- `FINNHUB_API_KEY` is read only on the server and never reaches the browser.
- The quote cache is in-process. If this ever runs on more than one instance, move it to Redis.
- Not deployed anywhere yet; everything runs locally.
