"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-brand">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">We hit an unexpected error</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Your data is safe — nothing is changed until an order is confirmed. Try again, or head back to the dashboard.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">ref {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
      </div>
    </main>
  );
}
