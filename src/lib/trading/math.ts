// Pure money math. All inputs/outputs are integer cents and whole share counts.

function assertInt(value: number, label: string) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer, got ${value}`);
  }
}

export function computeOrderTotalCents(quantity: number, priceCents: number): number {
  assertInt(quantity, "quantity");
  assertInt(priceCents, "priceCents");
  return quantity * priceCents;
}

// Weighted average cost of the combined position after a buy, rounded to the nearest cent.
export function computeNewAverageCost(
  existingQty: number,
  existingAvgCostCents: number,
  buyQty: number,
  buyPriceCents: number,
): number {
  assertInt(existingQty, "existingQty");
  assertInt(existingAvgCostCents, "existingAvgCostCents");
  assertInt(buyQty, "buyQty");
  assertInt(buyPriceCents, "buyPriceCents");
  const totalQty = existingQty + buyQty;
  if (totalQty <= 0) throw new RangeError("Resulting quantity must be positive");
  const totalCost = existingQty * existingAvgCostCents + buyQty * buyPriceCents;
  return Math.round(totalCost / totalQty);
}

export function computeRealizedPnlCents(
  sellQty: number,
  sellPriceCents: number,
  avgCostCents: number,
): number {
  assertInt(sellQty, "sellQty");
  assertInt(sellPriceCents, "sellPriceCents");
  assertInt(avgCostCents, "avgCostCents");
  return (sellPriceCents - avgCostCents) * sellQty;
}

export function computeUnrealizedPnlCents(
  quantity: number,
  currentPriceCents: number,
  avgCostCents: number,
): number {
  return (currentPriceCents - avgCostCents) * quantity;
}

export function canAfford(balanceCents: number, totalCostCents: number): boolean {
  return balanceCents >= totalCostCents;
}

export function canSell(ownedQty: number, sellQty: number): boolean {
  return sellQty > 0 && ownedQty >= sellQty;
}

export interface ValuedHolding {
  quantity: number;
  currentPriceCents: number;
}

export function computeHoldingsValueCents(holdings: ValuedHolding[]): number {
  return holdings.reduce((sum, h) => sum + h.quantity * h.currentPriceCents, 0);
}

export function computeTotalPortfolioValueCents(
  cashCents: number,
  holdings: ValuedHolding[],
): number {
  return cashCents + computeHoldingsValueCents(holdings);
}

// Percent return vs. a baseline, as a plain number (e.g. 12.5 for +12.5%).
export function computeReturnPercent(currentCents: number, baselineCents: number): number {
  if (baselineCents === 0) return 0;
  return ((currentCents - baselineCents) / baselineCents) * 100;
}

// Convert a decimal price (as returned by market data APIs) to integer cents.
export function toCents(price: number): number {
  return Math.round(price * 100);
}
