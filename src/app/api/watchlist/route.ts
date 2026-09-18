import { fail, handleError, ok, unauthorized, validationFailed } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { watchlistItems } from "@/lib/db/schema";
import { getWatchlist } from "@/lib/trading/portfolio";
import { addToWatchlistSchema } from "@/lib/validation/watchlist";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    return ok(await getWatchlist(user.id));
  } catch (error) {
    return handleError(error, "watchlist:get");
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be JSON.", 400);
  }

  const parsed = addToWatchlistSchema.safeParse(body);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    await db
      .insert(watchlistItems)
      .values({ userId: user.id, symbol: parsed.data.symbol })
      .onConflictDoNothing();
    return ok({ symbol: parsed.data.symbol }, { status: 201 });
  } catch (error) {
    return handleError(error, "watchlist:post");
  }
}
