import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Reuse the connection across Next.js dev HMR reloads so we don't leak pools.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client = globalForDb.pgClient ?? postgres(env.DATABASE_URL, { max: 10 });
if (env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
