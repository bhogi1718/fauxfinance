import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatPercent, formatSignedCents, trendClass } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  changeCents?: number | null;
  changePercent?: number | null;
  className?: string;
  showIcon?: boolean;
}

export function PriceChange({ changeCents, changePercent, className, showIcon = true }: PriceChangeProps) {
  const pct = changePercent ?? null;
  const Icon = pct === null || pct === 0 ? Minus : pct > 0 ? TrendingUp : TrendingDown;

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium tabular", trendClass(pct), className)}>
      {showIcon && <Icon className="size-3.5" aria-hidden />}
      {changeCents !== undefined && <span>{formatSignedCents(changeCents)}</span>}
      {pct !== null && <span>({formatPercent(pct, { signed: changeCents === undefined })})</span>}
    </span>
  );
}
