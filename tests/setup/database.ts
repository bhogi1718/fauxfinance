import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Creates the test database if needed and brings it up to date with the migrations.
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set for integration tests");

  const target = new URL(url);
  const dbName = target.pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to run integration tests against non-test database "${dbName}"`);
  }

  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const admin = postgres(maintenance.toString(), { max: 1 });
  try {
    const [exists] = await admin`select 1 from pg_database where datname = ${dbName}`;
    if (!exists) await admin.unsafe(`create database "${dbName}"`);
  } finally {
    await admin.end();
  }

  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle/migrations" });
  } finally {
    await client.end();
  }
}
