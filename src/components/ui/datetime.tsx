import { formatDateTime } from "@/lib/format";

// Locale/timezone formatting differs between server and browser; suppressing the
// hydration warning on this one leaf node is the honest fix.
export function DateTime({ value, className }: { value: Date | string; className?: string }) {
  const date = new Date(value);
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning className={className}>
      {formatDateTime(date)}
    </time>
  );
}
