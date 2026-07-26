const TIER_COLORS: Record<string, string> = {
  STRONG_BUY: '#16a34a', BUY: '#22c55e', ACCUMULATE: '#84cc16',
  WATCH: '#eab308', NEUTRAL: '#6b7280', AVOID: '#ef4444',
}

export function ScoreGauge({ score, size = 'md', label }: { score: number; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const dims = { sm: 48, md: 72, lg: 96 }
  const strokeW = { sm: 4, md: 6, lg: 8 }
  const dim = dims[size]; const sw = strokeW[size]
  const r = dim / 2 - sw; const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? TIER_COLORS.STRONG_BUY : score >= 65 ? TIER_COLORS.BUY : score >= 50 ? TIER_COLORS.ACCUMULATE : score >= 35 ? TIER_COLORS.WATCH : score >= 20 ? TIER_COLORS.NEUTRAL : TIER_COLORS.AVOID
  const tier = score >= 80 ? 'STRONG BUY' : score >= 65 ? 'BUY' : score >= 50 ? 'ACCUMULATE' : score >= 35 ? 'WATCH' : score >= 20 ? 'NEUTRAL' : 'AVOID'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={dim} height={dim} className="transform -rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth={sw} />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 8px ${color}aa)`,
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        <text
          x={dim / 2}
          y={dim / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={dims[size] / 3.8 + 2}
          fontWeight="900"
          fontFamily="var(--font-mono)"
          className="transform rotate-90"
          style={{ transformOrigin: 'center' }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <span className="text-[11px] font-medium text-muted-foreground">{label}</span>}
      <span
        className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border shadow-sm"
        style={{ backgroundColor: color + '15', color, borderColor: color + '35' }}
      >
        {tier}
      </span>
    </div>
  )
}

export function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? '#6b7280'
  return (
    <span
      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono shadow-sm"
      style={{ backgroundColor: color + '18', color, borderColor: color + '40' }}
    >
      {tier?.replace(/_/g, ' ') ?? tier}
    </span>
  )
}
