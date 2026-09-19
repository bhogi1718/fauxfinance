import { z } from "zod";
import { ORDER_SIDES, SUPPORTED_SYMBOLS } from "@/lib/trading/constants";

export const symbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(SUPPORTED_SYMBOLS, { error: "That stock isn't supported yet." }));

export const placeOrderSchema = z.object({
  symbol: symbolSchema,
  side: z.enum(ORDER_SIDES),
  quantity: z
    .number({ error: "Enter how many shares." })
    .int("Whole shares only.")
    .positive("Quantity must be at least 1.")
    .max(1_000_000, "That's more shares than we allow in one order."),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const orderHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.iso.datetime().optional(),
});
