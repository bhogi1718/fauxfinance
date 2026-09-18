"use client";

import { useSyncExternalStore } from "react";

// Current time that ticks every `intervalMs`, but reads as null during SSR/hydration
// so server and client markup always match.
export function useNow(intervalMs = 60_000): number | null {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}
