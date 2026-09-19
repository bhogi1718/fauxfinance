import { z } from "zod";
import { handleError, ok, unauthorized, validationFailed } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { getPortfolio } from "@/lib/trading/portfolio";
import { PERFORMANCE_RANGES, getPerformance } from "@/lib/trading/snapshots";

export const dynamic = "force-dynamic";

const querySchema = z.object({ range: z.enum(PERFORMANCE_RANGES).default("1M") });

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    const portfolio = await getPortfolio(user.id);
    const points = await getPerformance(user.id, parsed.data.range, {
      totalValueCents: portfolio.totalValueCents,
      cashCents: portfolio.cashCents,
    });
    return ok({ range: parsed.data.range, points });
  } catch (error) {
    return handleError(error, "portfolio:performance");
  }
}
