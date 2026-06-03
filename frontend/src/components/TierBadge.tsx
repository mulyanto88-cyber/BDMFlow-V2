import { cn } from "@/lib/utils";
import { TIER_COLORS } from "@/lib/constants";

interface TierBadgeProps {
  tier: string;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const color = TIER_COLORS[tier] ?? "#6b7280";
  return (
    <span
      className={cn("badge", className)}
      style={{ backgroundColor: color + "18", color, border: `1px solid ${color}40` }}
    >
      {tier.replace(/_/g, " ")}
    </span>
  );
}
