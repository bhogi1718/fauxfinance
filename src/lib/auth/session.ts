import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

// Deduplicated per request so layouts, pages, and route handlers can all call it freely.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getSessionUser() {
  const session = await getSession();
  return session?.user ?? null;
}

// For pages: layouts and pages render in parallel, so a page can't rely on the
// layout's redirect having happened. Each protected page calls this itself.
export async function requireUser(next?: string) {
  const user = await getSessionUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}
