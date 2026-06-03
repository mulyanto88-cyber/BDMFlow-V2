import { cn } from "@/lib/utils";
import { TIER_COLORS } from "@/lib/constants";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ScoreGauge({ score, size = "md", label }: ScoreGaugeProps) {
  const dims = { sm: 48, md: 72, lg: 96 };
  const strokeW = { sm: 4, md: 6, lg: 8 };
  const fontSize = { sm: 12, md: 18, lg: 24 };
  const dim = dims[size];
  const sw = strokeW[size];
  const r = dim / 2 - sw;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 80 ? TIER_COLORS.STRONG_BUY :
    score >= 65 ? TIER_COLORS.BUY :
    score >= 50 ? TIER_COLORS.ACCUMULATE :
    score >= 35 ? TIER_COLORS.WATCH :
    score >= 20 ? TIER_COLORS.NEUTRAL :
    TIER_COLORS.AVOID;

  const tierLabel =
    score >= 80 ? "STRONG BUY" :
    score >= 65 ? "BUY" :
    score >= 50 ? "ACCUMULATE" :
    score >= 35 ? "WATCH" :
    score >= 20 ? "NEUTRAL" :
    "AVOID";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dim} height={dim} className="transform -rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={sw} />
        <circle
          cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <text
          x={dim / 2} y={dim / 2} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={fontSize[size]} fontWeight="bold"
          className="transform rotate-90"
          style={{ transformOrigin: "center" }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <span className="text-xs text-[var(--color-text-muted)]">{label}</span>}
      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full")} style={{ backgroundColor: color + "20", color }}>
        {tierLabel}
      </span>
    </div>
  );
}
