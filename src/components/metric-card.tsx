import { cn } from '@/lib/utils'

export function MetricCard({ label, value, sub, trend, className }: {
  label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'neutral'; className?: string
}) {
  return (
    <div className={cn('glass rounded-xl p-4 border border-white/5 card-hover', className)}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</div>
      <div className={cn('text-xl font-black mt-1 counter', trend === 'up' && 'text-emerald-400', trend === 'down' && 'text-red-400')}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}
