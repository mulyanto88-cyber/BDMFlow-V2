'use client'

interface SectorData {
  sector: string
  momentum_score?: number
  stock_count?: number
  avg_change_pct?: number
  foreign_flow?: number
  whale_count?: number
  signal?: string
  flow_intensity?: string
  gainers?: number
  losers?: number
}

interface Props {
  data?: SectorData[]
  sectors?: SectorData[]
  onSectorClick?: (sector: string) => void
  selectedSector?: string | null
}

function getHeatColor(chg: number): { bg: string; border: string } {
  if (chg >= 3)    return { bg: 'rgba(34,197,94,0.36)',  border: 'rgba(34,197,94,0.52)' }
  if (chg >= 1.5)  return { bg: 'rgba(34,197,94,0.22)',  border: 'rgba(34,197,94,0.36)' }
  if (chg >= 0.5)  return { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.22)' }
  if (chg >= 0)    return { bg: 'rgba(34,197,94,0.05)',  border: 'rgba(255,255,255,0.06)' }
  if (chg >= -0.5) return { bg: 'rgba(239,68,68,0.05)',  border: 'rgba(255,255,255,0.06)' }
  if (chg >= -1.5) return { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.22)' }
  if (chg >= -3)   return { bg: 'rgba(239,68,68,0.22)',  border: 'rgba(239,68,68,0.36)' }
  return            { bg: 'rgba(239,68,68,0.36)',  border: 'rgba(239,68,68,0.52)' }
}

export function SectorHeatmap({ data, sectors, onSectorClick, selectedSector }: Props) {
  const items = data ?? sectors ?? []
  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {items.map((s) => {
        const score    = Number(s.momentum_score ?? 0)
        const chg      = Number(s.avg_change_pct ?? 0)
        const whale    = Number(s.whale_count ?? 0)
        const gainers  = Number(s.gainers ?? 0)
        const total    = Number(s.stock_count ?? 0)
        const breadth  = total > 0 ? Math.round((gainers / total) * 100) : 0
        const isSelected = selectedSector === s.sector
        const { bg, border } = getHeatColor(chg)

        return (
          <div
            key={s.sector}
            onClick={() => onSectorClick?.(s.sector)}
            className="heatmap-cell p-3 rounded-xl"
            style={{
              background: bg,
              border: `1px solid ${isSelected ? 'hsl(var(--primary))' : border}`,
              boxShadow: isSelected
                ? '0 0 0 2px hsl(var(--primary)), 0 4px 20px rgba(var(--primary-glow-rgb),0.30)'
                : undefined,
            }}
          >
            {/* Sector name */}
            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-foreground/60 mb-2 truncate leading-tight">
              {s.sector}
            </div>

            {/* Change % — headline number */}
            <div className={`text-xl font-black counter leading-none ${chg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ textShadow: chg >= 1.5 ? '0 0 12px rgba(34,197,94,0.4)' : chg <= -1.5 ? '0 0 12px rgba(239,68,68,0.4)' : undefined }}>
              {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
            </div>

            {/* Score badge + stock count */}
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded counter ${
                score >= 50 ? 'bg-emerald-500/20 text-emerald-400' :
                score >= 30 ? 'bg-slate-500/15 text-slate-400' :
                              'bg-red-500/15 text-red-400'
              }`}>
                {score}
              </span>
              <span className="text-[9px] text-muted-foreground">{total}</span>
            </div>

            {/* Breadth bar */}
            <div className="mt-1.5 h-1 w-full bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${breadth >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${breadth}%` }}
              />
            </div>

            {/* Whale badge */}
            {whale > 0 && (
              <div className="mt-1.5 text-[8px] text-amber-400 font-bold">🐋 {whale}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SectorHeatmap
