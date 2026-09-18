import { and, eq } from "drizzle-orm";
import { handleError, notFound, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { watchlistItems } from "@/lib/db/schema";
import { isSupportedSymbol } from "@/lib/trading/constants";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const symbol = (await params).symbol.toUpperCase();
  if (!isSupportedSymbol(symbol)) return notFound(`${symbol} isn't a supported stock.`);

  try {
    await db
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.userId, user.id), eq(watchlistItems.symbol, symbol)));
    return ok({ symbol });
  } catch (error) {
    return handleError(error, "watchlist:delete");
  }
}
