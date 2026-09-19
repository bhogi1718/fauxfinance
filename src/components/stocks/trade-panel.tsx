"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlaceOrder, usePortfolio, useQuotes } from "@/hooks/use-market";
import { formatCents, formatShares } from "@/lib/format";
import type { Quote } from "@/lib/market/quotes";
import type { OrderSide, StockSymbol } from "@/lib/trading/constants";
import { cn } from "@/lib/utils";

interface TradePanelProps {
  symbol: StockSymbol;
  initialQuote: Quote | null;
}

export function TradePanel({ symbol, initialQuote }: TradePanelProps) {
  const [side, setSide] = useState<OrderSide>("BUY");
  const [qtyInput, setQtyInput] = useState("1");
  const [confirming, setConfirming] = useState(false);
  const placeOrder = usePlaceOrder();
  const { data: portfolio } = usePortfolio();
  const { data: quotes } = useQuotes([symbol], {
    pollMs: 10_000,
    initialData: initialQuote ? ({ [symbol]: initialQuote } as Record<StockSymbol, Quote | null>) : undefined,
  });

  const quote = quotes?.[symbol] ?? initialQuote;
  const holding = portfolio?.holdings.find((h) => h.symbol === symbol);
  const owned = holding?.quantity ?? 0;
  const cash = portfolio?.cashCents ?? 0;

  const quantity = useMemo(() => {
    const n = Number(qtyInput);
    return Number.isInteger(n) && n > 0 ? n : 0;
  }, [qtyInput]);

  const totalCents = quote ? quantity * quote.priceCents : 0;
  const maxBuy = quote ? Math.floor(cash / quote.priceCents) : 0;
  const maxQty = side === "BUY" ? maxBuy : owned;

  const validation = (() => {
    if (!quote) return "Waiting for a live price…";
    if (quantity === 0) return "Enter a whole number of shares.";
    if (side === "BUY" && totalCents > cash) return `You can afford up to ${formatShares(maxBuy)}.`;
    if (side === "SELL" && quantity > owned) return owned === 0 ? `You don't own ${symbol}.` : `You only own ${formatShares(owned)}.`;
    return null;
  })();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (validation) return;
    setConfirming(true);
  }

  function confirm() {
    placeOrder.mutate(
      { symbol, side, quantity },
      {
        onSuccess: (result) => {
          toast.success(
            `${side === "BUY" ? "Bought" : "Sold"} ${formatShares(quantity)} of ${symbol} at ${formatCents(result.transaction.priceCents)}`,
            { description: `Cash balance: ${formatCents(result.balanceCents)}` },
          );
          setQtyInput("1");
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setConfirming(false),
      },
    );
  }

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="text-base">Trade {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <Tabs value={side} onValueChange={(v) => setSide(v as OrderSide)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="BUY" className="data-[state=active]:text-gain">Buy</TabsTrigger>
              <TabsTrigger value="SELL" className="data-[state=active]:text-loss">Sell</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Shares</Label>
              {maxQty > 0 && (
                <button
                  type="button"
                  onClick={() => setQtyInput(String(maxQty))}
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Max {maxQty.toLocaleString()}
                </button>
              )}
            </div>
            <Input
              id="quantity"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value.replace(/[^0-9]/g, ""))}
              className="tabular text-lg"
              aria-describedby="quantity-hint"
            />
            <p id="quantity-hint" className="text-xs text-muted-foreground">
              {side === "BUY" ? `Buying power ${formatCents(cash)}` : `You own ${formatShares(owned)}`}
            </p>
          </div>

          <Separator />

          <dl className="space-y-2 text-sm">
            <Row label="Market price">
              {quote ? <span className="tabular">{formatCents(quote.priceCents)}</span> : <Skeleton className="h-4 w-16" />}
            </Row>
            <Row label="Estimated total">
              <span className={cn("tabular font-semibold", !quote && "text-muted-foreground")}>
                {quote ? formatCents(totalCents) : "—"}
              </span>
            </Row>
            {side === "BUY" && quote && (
              <Row label="Cash after">
                <span className="tabular">{formatCents(cash - totalCents)}</span>
              </Row>
            )}
          </dl>

          <Button
            type="submit"
            size="lg"
            className={cn(
              "w-full",
              side === "BUY" ? "bg-gain text-background hover:bg-gain/85" : "bg-loss text-background hover:bg-loss/85",
            )}
            disabled={!!validation || placeOrder.isPending}
          >
            {placeOrder.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {side === "BUY" ? "Buy" : "Sell"} {quantity > 0 ? formatShares(quantity) : ""}
          </Button>

          {validation && quantity > 0 && (
            <p role="status" className="text-center text-xs text-muted-foreground">
              {validation}
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">Market order · executes instantly at the current price</p>
        </form>
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {side === "BUY" ? "purchase" : "sale"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {side === "BUY" ? "Buy" : "Sell"} {formatShares(quantity)} of {symbol} at about{" "}
              <span className="tabular font-medium text-foreground">{formatCents(quote?.priceCents)}</span> each, for an
              estimated <span className="tabular font-medium text-foreground">{formatCents(totalCents)}</span>. The order fills at
              the live price the moment you confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={placeOrder.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              disabled={placeOrder.isPending}
              className={side === "BUY" ? "bg-gain text-background hover:bg-gain/85" : "bg-loss text-background hover:bg-loss/85"}
            >
              {placeOrder.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Confirm {side === "BUY" ? "buy" : "sell"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
