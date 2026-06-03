'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="p-4 border-t border-white/[0.05] flex items-center justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-border/30 text-xs font-bold disabled:opacity-50 hover:bg-white/[0.05] transition-all"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <span className="text-xs text-muted-foreground">
        Page <span className="text-primary font-bold">{page}</span> of{' '}
        <span className="font-bold">{totalPages}</span>
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-border/30 text-xs font-bold disabled:opacity-50 hover:bg-white/[0.05] transition-all"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
