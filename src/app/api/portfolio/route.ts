import { handleError, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { getPortfolio } from "@/lib/trading/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    return ok(await getPortfolio(user.id));
  } catch (error) {
    return handleError(error, "portfolio");
  }
}
