import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { provider } from "@/lib/market/quotes";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({
      status: "ok",
      database: "ok",
      marketData: provider.name,
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
