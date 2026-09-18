import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

export async function MarketingHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/explore" className="hover:text-foreground">Explore</Link>
          <Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link>
          <Link href="/faq" className="hover:text-foreground">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button render={<Link href="/dashboard" />}>Go to dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" render={<Link href="/login" />}>Sign in</Button>
              <Button render={<Link href="/signup" />}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
