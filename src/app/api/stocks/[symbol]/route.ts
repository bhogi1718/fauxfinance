import { handleError, notFound, ok } from "@/lib/api/response";
import { getQuote } from "@/lib/finnhub/quotes";
import { STOCKS, isSupportedSymbol } from "@/lib/trading/constants";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const raw = (await params).symbol.toUpperCase();
  if (!isSupportedSymbol(raw)) return notFound(`${raw} isn't a supported stock.`);

  try {
    const quote = await getQuote(raw);
    return ok({ symbol: raw, ...STOCKS[raw], quote });
  } catch (error) {
    return handleError(error, `stocks/${raw}`);
  }
}
