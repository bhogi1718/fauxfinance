import { expect, test } from "@playwright/test";
import { money, placeOrder, signUp } from "./helpers";

test.describe("trading flow", () => {
  test("signup grants $100,000 and lands on the dashboard", async ({ page }) => {
    const user = await signUp(page);
    await expect(page.getByRole("heading", { name: `Hi, ${user.name.split(" ")[0]}` })).toBeVisible();
    await expect(page.getByText("$100,000.00").first()).toBeVisible();
    await expect(page.getByText("No positions yet")).toBeVisible();
  });

  test("buy, partial sell, and ledger stay consistent", async ({ page }) => {
    await signUp(page);

    await placeOrder(page, "AAPL", "Buy", 10);
    await page.goto("/portfolio");
    const row = page.getByRole("row", { name: /AAPL/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").nth(1)).toHaveText("10");

    await placeOrder(page, "AAPL", "Sell", 4);
    await page.goto("/portfolio");
    await expect(page.getByRole("row", { name: /AAPL/ }).getByRole("cell").nth(1)).toHaveText("6");

    await page.goto("/history");
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(3); // header + 2 trades
    await expect(rows.nth(1)).toContainText("SELL");
    await expect(rows.nth(2)).toContainText("BUY");

    // Cash after the last trade shown in the ledger must match the header wallet chip.
    const cashAfter = await rows.nth(1).getByRole("cell").last().innerText();
    const chip = await page.locator("header").getByText(/^\$[\d,]+\.\d{2}$/).innerText();
    expect(money(cashAfter)).toBe(money(chip));
  });

  test("cannot sell shares you do not own", async ({ page }) => {
    await signUp(page);
    await page.goto("/stocks/tsla");
    await page.getByRole("tab", { name: "Sell" }).click();
    await page.getByLabel("Shares").fill("1");
    await expect(page.getByRole("button", { name: /^Sell 1 share/ })).toBeDisabled();
    await expect(page.getByText("You don't own TSLA.")).toBeVisible();
  });

  test("cannot buy more than cash allows", async ({ page }) => {
    await signUp(page);
    await page.goto("/stocks/nvda");
    await page.getByLabel("Shares").fill("100000");
    await expect(page.getByRole("button", { name: /^Buy/ })).toBeDisabled();
    await expect(page.getByText(/You can afford up to/)).toBeVisible();
  });

  test("watchlist toggle persists across pages", async ({ page }) => {
    await signUp(page);
    await page.goto("/stocks/msft");
    await page.getByRole("button", { name: "Add MSFT to watchlist" }).click();
    await expect(page.getByText("Added MSFT to watchlist")).toBeVisible();

    await page.goto("/watchlist");
    await expect(page.getByText("Microsoft Corporation", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Remove MSFT from watchlist" }).click();
    await expect(page.getByText("Your watchlist is empty")).toBeVisible();
  });

  test("reset portfolio restores the starting balance", async ({ page }) => {
    await signUp(page);
    await placeOrder(page, "UBER", "Buy", 5);

    await page.goto("/settings");
    await page.getByRole("button", { name: "Reset portfolio" }).click();
    await page.getByRole("button", { name: "Reset everything" }).click();
    await expect(page.getByText("Portfolio reset")).toBeVisible();

    await page.goto("/portfolio");
    await expect(page.getByText("No positions yet")).toBeVisible();
    await expect(page.getByText("$100,000.00").first()).toBeVisible();
  });

  test("command palette jumps to a stock", async ({ page }) => {
    await signUp(page);
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder("Search stocks or pages…").fill("nvidia");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/stocks/nvda");
    await expect(page.getByRole("heading", { name: "NVIDIA Corporation" })).toBeVisible();
  });
});

test.describe("auth", () => {
  test("protected pages redirect to login and back", async ({ page }) => {
    const user = await signUp(page);
    await page.context().clearCookies();

    await page.goto("/portfolio");
    await page.waitForURL("**/login?next=%2Fportfolio");

    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/portfolio");
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
  });

  test("signed-in users skip the auth pages", async ({ page }) => {
    await signUp(page);
    await page.goto("/login");
    await page.waitForURL("**/dashboard");
  });

  test("wrong password is rejected without leaking details", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@test.local");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });
});
