import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, showWordmark = true }: { href?: string; className?: string; showWordmark?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="FauxFinance home">
      <Image src="/TradeTact.png" alt="" width={36} height={29} priority className="h-7 w-auto" />
      {showWordmark && <span className="text-lg font-semibold tracking-tight">FauxFinance</span>}
    </Link>
  );
}
