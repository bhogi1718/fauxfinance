import "server-only";
import { headers } from "next/headers";
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
