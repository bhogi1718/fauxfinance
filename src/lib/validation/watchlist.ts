import { z } from "zod";
import { symbolSchema } from "./orders";

export const addToWatchlistSchema = z.object({ symbol: symbolSchema });
