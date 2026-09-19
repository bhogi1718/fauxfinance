import "server-only";
import { fail } from "./response";

// Fixed-window limiter, per key, in-process. Enough for one instance; use Redis if scaled out.
interface Bucket {
  count: number;
  resetAt: number;
}

const g = globalThis as unknown as { rateBuckets?: Map<string, Bucket> };
const buckets = (g.rateBuckets ??= new Map<string, Bucket>());

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export function clientKey(req: Request, scope: string, userId?: string) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  return `${scope}:${userId ?? ip}`;
}

export function rateLimited(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const res = fail("RATE_LIMITED", "Too many requests. Slow down a little.", 429);
  res.headers.set("Retry-After", String(retryAfter));
  return res;
}

// Rejects cross-site state-changing requests. Session cookies are SameSite=Lax, which
// already blocks most CSRF, but an explicit Origin check costs nothing.
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients / same-origin GETs
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export function crossOrigin() {
  return fail("FORBIDDEN", "Cross-origin requests aren't allowed.", 403);
}
