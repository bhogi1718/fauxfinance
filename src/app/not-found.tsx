import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Logo />
      <p className="mt-10 text-sm font-medium text-brand">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">That page doesn&apos;t exist</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        The link may be broken, or the stock you&apos;re looking for isn&apos;t supported yet.
      </p>
      <div className="mt-8 flex gap-3">
        <Button render={<Link href="/" />}>Go home</Button>
        <Button variant="outline" render={<Link href="/explore" />}>
          Explore stocks
        </Button>
      </div>
    </main>
  );
}
