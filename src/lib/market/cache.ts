// Single-process TTL cache with in-flight de-duplication.
// Fine for one local Node instance; swap for Redis if this ever runs on multiple instances.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number) {}

  // Expired entries are kept (not deleted) so peekStale can serve them during outages.
  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.value;
  }

  // Returns the cached value, or runs `load` once even when many callers race on a cold key.
  async getOrLoad(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = load()
      .then((value) => {
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  // Serve stale data when a refresh fails rather than blanking the UI.
  peekStale(key: string): T | undefined {
    return this.entries.get(key)?.value;
  }
}
