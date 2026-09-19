import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

loadEnv();

// Integration tests run against a separate database on the same Postgres server.
const devUrl = process.env.DATABASE_URL ?? "postgresql://fauxfinance:fauxfinance_dev@localhost:5433/fauxfinance";
const testUrl = process.env.TEST_DATABASE_URL ?? devUrl.replace(/\/[^/?]+(\?|$)/, "/fauxfinance_test$1");

const sharedEnv = {
  NODE_ENV: "test",
  DATABASE_URL: testUrl,
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
  BETTER_AUTH_URL: "http://localhost:3000",
  MARKET_DATA_PROVIDER: "mock",
  QUOTE_CACHE_TTL_MS: "1000",
};

// `test.env` only reaches worker processes; globalSetup runs here in the main process.
Object.assign(process.env, sharedEnv);

const serverOnlyStub = fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": serverOnlyStub },
  },
  test: {
    env: sharedEnv,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.db.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.db.test.ts"],
          globalSetup: ["./tests/setup/database.ts"],
          // The engine relies on row locks; run files serially so tests don't fight over the DB.
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
});
