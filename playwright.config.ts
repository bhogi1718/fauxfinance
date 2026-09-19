import { defineConfig, devices } from "@playwright/test";

// Locally: point E2E_BASE_URL at your running `npm run dev` (Next allows one dev
// server per directory). Otherwise (e.g. CI) a production build is started on 3100.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const externalUrl = process.env.E2E_BASE_URL;
const baseURL = externalUrl ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalUrl
    ? undefined
    : {
        command: `npm run build && npx next start --port ${PORT}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: false,
        timeout: 240_000,
        env: {
          MARKET_DATA_PROVIDER: "mock",
          BETTER_AUTH_URL: baseURL,
          NEXT_PUBLIC_APP_URL: baseURL,
        },
      },
});
