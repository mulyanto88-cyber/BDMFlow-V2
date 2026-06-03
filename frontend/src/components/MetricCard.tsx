import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, sub, trend, className }: MetricCardProps) {
  return (
    <div className={cn("card flex flex-col gap-1", className)}>
      <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
      <span className={cn(
        "text-xl font-bold",
        trend === "up" && "text-green-400",
        trend === "down" && "text-red-400"
      )}>
        {value}
      </span>
      {sub && <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>}
    </div>
  );
}
