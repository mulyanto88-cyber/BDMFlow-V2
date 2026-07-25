export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-4">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-2 w-20" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  )
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4">
          <Skeleton className="h-2.5 w-20 mb-3" />
          <Skeleton className="h-7 w-28 mb-1.5" />
          <Skeleton className="h-2 w-14" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`${height} glass rounded-2xl p-4 flex items-end gap-3`}>
      {[60, 40, 80, 50, 70, 45, 75, 55].map((h, i) => (
        <div key={i} className="shimmer flex-1 rounded-t-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export function SkeletonWidget() {
  return (
    <div className="glass rounded-2xl p-4">
      <Skeleton className="h-3 w-32 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2 w-40" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
