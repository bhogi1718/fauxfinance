import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { STARTING_CASH_CENTS } from "@/lib/trading/constants";

export const metadata: Metadata = { title: "FAQ" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is paper trading?",
    a: "Paper trading is simulated trading. You buy and sell real stocks at real prices, but with virtual money, so you can practice strategies and learn how markets behave without risking a cent.",
  },
  {
    q: "How does FauxFinance work?",
    a: `Every account starts with ${formatCents(STARTING_CASH_CENTS)} in virtual cash. Pick a stock, place a market order, and it fills instantly at the current quote. Your holdings, cash balance, and profit or loss update in real time.`,
  },
  {
    q: "Are the prices real?",
    a: "Yes. Quotes come from Finnhub and refresh every few seconds while the US market is open. Outside market hours you'll see the last traded price and a “Market closed” indicator.",
  },
  {
    q: "Why should I paper trade before using real money?",
    a: "It lets you build confidence, test ideas, and make beginner mistakes where they cost nothing. Most people underestimate how emotional real trading is — a simulator helps you develop discipline first.",
  },
  {
    q: "Is paper trading realistic?",
    a: "Mostly. Prices are real, but a simulator can't fully replicate slippage, liquidity limits, or the psychology of losing real money. Treat it as a learning tool, not a guarantee of future results.",
  },
  {
    q: "Which stocks can I trade?",
    a: "A curated set of large US stocks: Apple, Tesla, Uber, Amazon, Alphabet, Microsoft and NVIDIA. More symbols will be added over time.",
  },
  {
    q: "What order types are supported?",
    a: "Market orders — they execute immediately at the current price. Limit and stop orders aren't available yet.",
  },
  {
    q: "How is my profit and loss calculated?",
    a: "Each holding tracks a weighted average cost. Unrealized P&L is the difference between that cost and the current price for shares you still hold. Realized P&L is locked in when you sell and recorded permanently in your trade history.",
  },
  {
    q: "How does the leaderboard rank traders?",
    a: "By total portfolio value: your cash plus the market value of everything you hold, using the latest prices.",
  },
  {
    q: "Can I reset my account or get more cash?",
    a: "Not yet. The starting balance is the same for everyone so the leaderboard stays fair.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
      <p className="mt-2 text-muted-foreground">Everything you need to know about paper trading on FauxFinance.</p>

      <Accordion className="mt-10">
        {FAQS.map(({ q, a }) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-xl border border-brand/30 bg-brand/5 p-6 text-center">
        <p className="font-medium">Ready to try it?</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign up in under a minute. No card required.</p>
        <Button className="mt-4" render={<Link href="/signup" />}>
          Create a free account
        </Button>
      </div>
    </div>
  );
}
