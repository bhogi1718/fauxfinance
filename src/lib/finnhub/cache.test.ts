import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "./cache";

describe("TtlCache", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("loads once and serves from cache until the TTL expires", async () => {
    const cache = new TtlCache<number>(1_000);
    const load = vi.fn(async () => 42);

    expect(await cache.getOrLoad("k", load)).toBe(42);
    expect(await cache.getOrLoad("k", load)).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_001);
    expect(await cache.getOrLoad("k", load)).toBe(42);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("de-duplicates concurrent loads for the same key", async () => {
    const cache = new TtlCache<string>(1_000);
    let resolve!: (v: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    const a = cache.getOrLoad("k", load);
    const b = cache.getOrLoad("k", load);
    const c = cache.getOrLoad("k", load);
    expect(load).toHaveBeenCalledTimes(1);

    resolve("v");
    expect(await Promise.all([a, b, c])).toEqual(["v", "v", "v"]);
  });

  it("does not cache a failed load and exposes stale data via peekStale", async () => {
    const cache = new TtlCache<number>(1_000);
    await cache.getOrLoad("k", async () => 1);
    vi.advanceTimersByTime(1_001);

    await expect(cache.getOrLoad("k", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(cache.get("k")).toBeUndefined();
    expect(cache.peekStale("k")).toBe(1);
  });
});
