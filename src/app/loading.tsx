import React from 'react'

export default function Loading() {
  return (
    <div className="space-y-4 pb-20 animate-fade-in w-full">

      {/* Command Strip Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1117] shadow-2xl">
        <div className="flex flex-wrap items-stretch">
          <div className="flex items-center gap-3 px-5 py-5 shrink-0">
            <div className="shimmer w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <div className="shimmer w-20 h-3 rounded-full" />
              <div className="shimmer w-36 h-4 rounded-md" />
              <div className="shimmer w-24 h-2.5 rounded-full" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col justify-center px-5 py-5 min-w-[120px] space-y-2">
              <div className="shimmer w-16 h-2.5 rounded-full" />
              <div className="shimmer w-20 h-6 rounded-md" />
              <div className="shimmer w-14 h-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Sector Rotation Skeleton */}
      <div className="glass rounded-2xl p-5 border border-white/[0.06] space-y-3">
        <div className="shimmer w-40 h-4 rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="shimmer h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Smart Money Radar Skeleton */}
      <div className="glass rounded-2xl p-5 border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="shimmer w-44 h-4 rounded-md" />
          <div className="shimmer w-24 h-3 rounded-md" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-52 glass rounded-xl p-4 border border-white/[0.06] space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="shimmer w-14 h-3.5 rounded-md" />
                  <div className="shimmer w-20 h-2 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="shimmer w-9 h-9 rounded-full" />
                <div className="space-y-1.5">
                  <div className="shimmer w-16 h-5 rounded-md" />
                  <div className="shimmer w-12 h-3 rounded-md" />
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.04]">
                <div className="shimmer w-14 h-2 rounded-md" />
                <div className="shimmer w-10 h-3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stealth Radar Skeleton */}
      <div className="glass rounded-2xl p-5 border border-white/[0.06] space-y-3">
        <div className="shimmer w-36 h-4 rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-4 border border-white/[0.06] space-y-2.5">
              <div className="flex justify-between">
                <div className="shimmer w-14 h-4 rounded-md" />
                <div className="shimmer w-14 h-4 rounded-full" />
              </div>
              <div className="shimmer w-20 h-6 rounded-md" />
              <div className="flex justify-between">
                <div className="shimmer w-16 h-2.5 rounded-md" />
                <div className="shimmer w-12 h-2.5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Big Player Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-4 border border-white/[0.06] space-y-3">
            <div className="shimmer w-32 h-3.5 rounded-md" />
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex justify-between items-center py-1">
                <div className="space-y-1">
                  <div className="shimmer w-24 h-3 rounded-md" />
                  <div className="shimmer w-16 h-2 rounded-md" />
                </div>
                <div className="shimmer w-14 h-3 rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}
