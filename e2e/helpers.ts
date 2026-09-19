import { expect, type Page } from "@playwright/test";

export function uniqueUser() {
  const id = Math.random().toString(36).slice(2, 10);
  return { name: `E2E Trader ${id}`, email: `e2e-${id}@test.local`, password: "e2e-password-123" };
}

export async function signUp(page: Page, user = uniqueUser()) {
  await page.goto("/signup");
  await page.getByLabel("Name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByLabel("Confirm password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");
  return user;
}

export async function placeOrder(page: Page, symbol: string, side: "Buy" | "Sell", quantity: number) {
  await page.goto(`/stocks/${symbol.toLowerCase()}`);
  await page.getByRole("tab", { name: side }).click();
  const qty = page.getByLabel("Shares");
  await qty.fill(String(quantity));
  const submit = page.getByRole("button", { name: new RegExp(`^${side} ${quantity} share`) });
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.getByRole("button", { name: `Confirm ${side.toLowerCase()}` }).click();
  await expect(page.getByText(new RegExp(`^${side === "Buy" ? "Bought" : "Sold"} ${quantity} share`))).toBeVisible();
}

export function money(text: string) {
  return Math.round(Number(text.replace(/[^0-9.-]/g, "")) * 100);
}
