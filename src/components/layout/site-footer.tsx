import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            A paper-trading sandbox. Prices are real, the money isn&apos;t. Nothing here is financial advice.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-10 text-sm">
          <div className="space-y-2">
            <p className="font-medium">Product</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link href="/explore" className="hover:text-foreground">Explore stocks</Link></li>
              <li><Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Account</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
              <li><Link href="/signup" className="hover:text-foreground">Create account</Link></li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} FauxFinance. Market data by Finnhub. Charts by TradingView.
        </p>
      </div>
    </footer>
  );
}
