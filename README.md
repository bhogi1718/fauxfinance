# FauxFinance

A paper-trading platform for US stocks. Every account starts with $100,000 in virtual cash; market orders fill at live prices; the money is fake, the bookkeeping is real.

**Features:** email/password accounts · buy/sell with confirmation · weighted-average cost basis, realized and unrealized P&L · portfolio performance chart · immutable trade history · watchlist · public leaderboard · ⌘K search · account settings with portfolio reset · TradingView charts, technicals and financials per stock.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · PostgreSQL · Drizzle ORM · Better Auth · Finnhub (or a built-in simulated market) · TanStack Query · Vitest · Playwright

## Run it locally

Prerequisites: Node 22+, Docker.

```bash
npm install
cp .env.example .env          # set BETTER_AUTH_SECRET (32+ chars). FINNHUB_API_KEY is optional.
npm run db:up                 # Postgres on localhost:5433
npm run db:migrate
npm run db:seed               # optional demo account; credentials are printed
npm run dev                   # http://localhost:3000
```

Without a Finnhub key the app runs on a **simulated market**: deterministic prices that drift minute to minute. Add a free key from finnhub.io to switch to real quotes (`MARKET_DATA_PROVIDER=auto` picks Finnhub when a key is present). `/api/health` tells you which provider is active.

## Scripts

| Script | What it does |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `test` | Vitest: unit + integration (integration needs Postgres running) |
| `test:unit` / `test:integration` | Just one project |
| `e2e` / `e2e:ui` | Playwright. Locally: `E2E_BASE_URL=http://localhost:3000 npm run e2e` against your dev server |
| `db:up` / `db:down` | Start / stop the Postgres container |
| `db:generate` / `db:migrate` | Create / apply migrations (drizzle-kit) |
| `db:migrate:prod` | Apply migrations without drizzle-kit (for containers) |
| `db:studio` | Browse the database |
| `db:seed` | Create the demo account |

## How trading works

- **Money is integer cents.** No floats anywhere in the ledger.
- **Market orders only.** An order executes immediately at the current cached quote after you confirm.
- **Atomic execution.** Each order is one Postgres transaction with `SELECT … FOR UPDATE` on the wallet, then the holding (always that order, so concurrent orders serialize instead of deadlocking). A double-click can't double-spend — there's an integration test that races eight buys to prove it.
- **Cost basis** is a weighted average, updated on every buy and untouched by sells.
- **Realized P&L** is written to an immutable `transactions` row at sale time; **unrealized P&L** is computed on read from the latest price.
- **Performance history** comes from `portfolio_snapshots`, written after every order and at most hourly on reads.
- **Leaderboard** ranks by total portfolio value (cash + holdings at market).

## Testing

- `src/lib/trading/math.test.ts` — pure money math, including cent-precision under repeated awkward prices.
- `src/lib/trading/engine.db.test.ts` — the engine against a real `fauxfinance_test` database (created and migrated automatically): ledger effects, rejection paths leaving no side effects, user isolation, racing buys, interleaved buy/sell.
- `e2e/` — Playwright through the real UI on the simulated market: signup, trade, ledger-vs-wallet consistency, guards, watchlist, reset, command palette, auth redirects.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit + integration tests, then E2E against a production build.

## Security notes

- `FINNHUB_API_KEY` and the database URL are read only on the server and never reach the browser.
- Security headers are set in `next.config.ts`; `X-Powered-By` is off.
- Order placement and portfolio reset are same-origin-checked and rate limited per user; Better Auth rate limits sign-in/sign-up in production.
- Environment is validated once at boot (`src/lib/env.ts`); a weak `BETTER_AUTH_SECRET` fails fast.
- Unauthenticated requests to app routes are redirected in `src/proxy.ts`; every protected page re-checks the session.

## Deploying (when you're ready)

A production `Dockerfile` is included (multi-stage, standalone output, non-root, healthcheck):

```bash
docker build -t fauxfinance .
docker run -p 3000:3000 -e DATABASE_URL=… -e BETTER_AUTH_SECRET=… -e BETTER_AUTH_URL=https://your.domain -e FINNHUB_API_KEY=… fauxfinance
```

Run `npm run db:migrate:prod` against the target database before the first start. The quote cache and rate limiter are in-process; if you run more than one instance, move both to Redis.

## Project layout

```
src/
  app/            (marketing) public · (auth) login/signup · (app) authenticated · api/ route handlers
  components/     ui/ (shadcn) plus feature components by area
  hooks/          TanStack Query hooks
  lib/trading/    constants, pure math, engine, portfolio queries, snapshots, reset
  lib/market/     provider interface, Finnhub + mock providers, TTL cache, quote service
  lib/auth/       Better Auth config, client, session helpers
  lib/db/         Drizzle client, schema, seed, migrate
  lib/api/        response envelope, rate limiting
  proxy.ts        route-level auth redirects
e2e/              Playwright specs
tests/            Vitest global setup and stubs
drizzle/          generated SQL migrations
```
