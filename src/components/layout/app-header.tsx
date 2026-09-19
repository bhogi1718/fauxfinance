"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, History, LayoutDashboard, LogOut, Menu, PieChart, Settings, Star, Trophy, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { StockSearch } from "@/components/stocks/stock-search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio } from "@/hooks/use-market";
import { signOut } from "@/lib/auth/auth-client";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/history", label: "History", icon: History },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

interface AppHeaderProps {
  user: { name: string; email: string };
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: portfolio } = usePortfolio();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
        onError: () => {
          toast.error("Couldn't sign you out. Try again.");
        },
      },
    });
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const links = NAV.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="mt-6 flex flex-col gap-1">{links}</div>
          </SheetContent>
        </Sheet>

        <Logo href="/dashboard" />

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          {links}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <StockSearch />
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm sm:flex">
            <Wallet className="size-4 text-brand" aria-hidden />
            {portfolio ? (
              <span className="tabular font-medium">{formatCents(portfolio.cashCents)}</span>
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />}>
              <Avatar className="size-8">
                <AvatarFallback className="bg-brand/15 text-xs font-semibold text-brand">{initials || "?"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
