import { fail, handleError, ok } from "@/lib/api/response";
import { getQuotes } from "@/lib/market/quotes";
import { SUPPORTED_SYMBOLS, type StockSymbol, isSupportedSymbol } from "@/lib/trading/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("symbols");
  const requested = param ? param.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : [];
  const symbols: StockSymbol[] = requested.length ? requested.filter(isSupportedSymbol) : SUPPORTED_SYMBOLS;

  if (requested.length && symbols.length === 0) {
    return fail("UNSUPPORTED_SYMBOLS", "None of the requested symbols are supported.", 400);
  }

  try {
    return ok(await getQuotes(symbols));
  } catch (error) {
    return handleError(error, "quotes");
  }
}
