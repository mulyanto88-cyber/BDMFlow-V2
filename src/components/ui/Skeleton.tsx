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
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  )
}
