import { handleError, ok } from "@/lib/api/response";
import { getLeaderboard } from "@/lib/trading/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getLeaderboard());
  } catch (error) {
    return handleError(error, "leaderboard");
  }
}
