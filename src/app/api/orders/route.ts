import { fail, handleError, ok, unauthorized, validationFailed } from "@/lib/api/response";
import { checkRateLimit, clientKey, crossOrigin, isSameOrigin, rateLimited } from "@/lib/api/rate-limit";
import { getSessionUser } from "@/lib/auth/session";
import { placeOrder } from "@/lib/trading/engine";
import { getTransactionHistory } from "@/lib/trading/portfolio";
import { orderHistoryQuerySchema, placeOrderSchema } from "@/lib/validation/orders";

export const dynamic = "force-dynamic";

const ORDER_LIMIT = { limit: 20, windowMs: 60_000 };

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return crossOrigin();

  const user = await getSessionUser();
  if (!user) return unauthorized();

  const rl = checkRateLimit(clientKey(req, "orders", user.id), ORDER_LIMIT);
  if (!rl.allowed) return rateLimited(rl.resetAt);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be JSON.", 400);
  }

  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    const result = await placeOrder({ userId: user.id, ...parsed.data });
    return ok(result, { status: 201 });
  } catch (error) {
    return handleError(error, "orders:post");
  }
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = orderHistoryQuerySchema.safeParse(params);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    const { limit, cursor } = parsed.data;
    return ok(await getTransactionHistory(user.id, limit, cursor ? new Date(cursor) : undefined));
  } catch (error) {
    return handleError(error, "orders:get");
  }
}
