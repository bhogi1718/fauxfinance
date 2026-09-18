import { describe, expect, it } from "vitest";
import {
  canAfford,
  canSell,
  computeHoldingsValueCents,
  computeNewAverageCost,
  computeOrderTotalCents,
  computeRealizedPnlCents,
  computeReturnPercent,
  computeTotalPortfolioValueCents,
  computeUnrealizedPnlCents,
  toCents,
} from "./math";

describe("computeOrderTotalCents", () => {
  it("multiplies quantity by price in cents", () => {
    expect(computeOrderTotalCents(5, 15_000)).toBe(75_000);
  });

  it("rejects non-integer inputs", () => {
    expect(() => computeOrderTotalCents(1.5, 100)).toThrow(TypeError);
    expect(() => computeOrderTotalCents(1, 100.5)).toThrow(TypeError);
  });
});

describe("computeNewAverageCost", () => {
  it("uses the buy price when opening a new position", () => {
    expect(computeNewAverageCost(0, 0, 5, 15_000)).toBe(15_000);
  });

  it("weights the average across multiple buys (worked example)", () => {
    // 5 @ $150 then 5 @ $170 -> $160
    expect(computeNewAverageCost(5, 15_000, 5, 17_000)).toBe(16_000);
  });

  it("weights unequal lot sizes correctly", () => {
    // 10 @ $100 + 30 @ $200 -> (1000 + 6000) / 40 = $175
    expect(computeNewAverageCost(10, 10_000, 30, 20_000)).toBe(17_500);
  });

  it("rounds to the nearest cent instead of drifting", () => {
    // 3 @ $33.33 + 1 @ $33.34 -> 13333 / 4 = 3333.25 -> 3333
    expect(computeNewAverageCost(3, 3_333, 1, 3_334)).toBe(3_333);
  });

  it("stays exact across many sequential buys at awkward prices", () => {
    let qty = 0;
    let avg = 0;
    for (let i = 0; i < 1_000; i++) {
      avg = computeNewAverageCost(qty, avg, 1, 3_333);
      qty += 1;
    }
    expect(avg).toBe(3_333);
    expect(Number.isInteger(avg)).toBe(true);
  });
});

describe("computeRealizedPnlCents", () => {
  it("computes a gain from the worked example", () => {
    // sell 4 @ $200 with avg cost $160 -> +$160
    expect(computeRealizedPnlCents(4, 20_000, 16_000)).toBe(16_000);
  });

  it("returns a negative number for a loss", () => {
    expect(computeRealizedPnlCents(10, 9_000, 10_000)).toBe(-10_000);
  });

  it("returns zero when selling at cost", () => {
    expect(computeRealizedPnlCents(7, 5_000, 5_000)).toBe(0);
  });
});

describe("computeUnrealizedPnlCents", () => {
  it("marks the whole position to the current price", () => {
    expect(computeUnrealizedPnlCents(6, 20_000, 16_000)).toBe(24_000);
    expect(computeUnrealizedPnlCents(6, 12_000, 16_000)).toBe(-24_000);
  });
});

describe("canAfford / canSell", () => {
  it("allows a purchase that exactly matches the balance", () => {
    expect(canAfford(75_000, 75_000)).toBe(true);
  });

  it("rejects a purchase one cent over the balance", () => {
    expect(canAfford(74_999, 75_000)).toBe(false);
  });

  it("rejects overselling and non-positive sells", () => {
    expect(canSell(5, 6)).toBe(false);
    expect(canSell(5, 0)).toBe(false);
    expect(canSell(0, 1)).toBe(false);
  });

  it("allows selling the full position", () => {
    expect(canSell(5, 5)).toBe(true);
  });
});

describe("portfolio valuation", () => {
  const holdings = [
    { quantity: 6, currentPriceCents: 20_000 },
    { quantity: 2, currentPriceCents: 92_479 },
  ];

  it("sums holdings at market", () => {
    expect(computeHoldingsValueCents(holdings)).toBe(120_000 + 184_958);
  });

  it("adds cash to holdings value", () => {
    expect(computeTotalPortfolioValueCents(1_000_000, holdings)).toBe(1_304_958);
  });

  it("computes return percent against the starting cash baseline", () => {
    expect(computeReturnPercent(11_000_000, 10_000_000)).toBeCloseTo(10);
    expect(computeReturnPercent(9_500_000, 10_000_000)).toBeCloseTo(-5);
    expect(computeReturnPercent(10_000_000, 0)).toBe(0);
  });
});

describe("toCents", () => {
  it("rounds decimal prices to integer cents", () => {
    expect(toCents(183.0)).toBe(18_300);
    expect(toCents(168.47)).toBe(16_847);
    expect(toCents(0.005)).toBe(1);
    expect(toCents(924.789)).toBe(92_479);
  });
});
