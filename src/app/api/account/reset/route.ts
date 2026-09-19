import { handleError, ok, unauthorized } from "@/lib/api/response";
import { checkRateLimit, clientKey, crossOrigin, isSameOrigin, rateLimited } from "@/lib/api/rate-limit";
import { getSessionUser } from "@/lib/auth/session";
import { resetPortfolio } from "@/lib/trading/reset";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return crossOrigin();

  const user = await getSessionUser();
  if (!user) return unauthorized();

  const rl = checkRateLimit(clientKey(req, "reset", user.id), { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) return rateLimited(rl.resetAt);

  try {
    await resetPortfolio(user.id);
    return ok({ reset: true });
  } catch (error) {
    return handleError(error, "account:reset");
  }
}
