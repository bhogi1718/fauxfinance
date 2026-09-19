import { z } from "zod";

const PLACEHOLDER = /^(replace-with|your-|changeme|xxx)/i;
const optionalSecret = z
  .string()
  .trim()
  .transform((v) => (v === "" || PLACEHOLDER.test(v) ? undefined : v))
  .optional();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),
  FINNHUB_API_KEY: optionalSecret,
  MARKET_DATA_PROVIDER: z.enum(["auto", "finnhub", "mock"]).default("auto"),
  QUOTE_CACHE_TTL_MS: z.coerce.number().int().positive().default(15_000),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join(".") || "?"}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return parsed.data;
}

export const env = load();
