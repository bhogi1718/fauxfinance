import { handleError, ok } from "@/lib/api/response";
import { getQuotes } from "@/lib/market/quotes";
import { STOCKS, SUPPORTED_SYMBOLS } from "@/lib/trading/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quotes = await getQuotes(SUPPORTED_SYMBOLS);
    const stocks = SUPPORTED_SYMBOLS.map((symbol) => ({
      symbol,
      ...STOCKS[symbol],
      quote: quotes[symbol],
    }));
    return ok(stocks);
  } catch (error) {
    return handleError(error, "stocks");
  }
}
