'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface SortableHeaderProps {
  field: string
  label: string
  currentSort: string
  direction: 'asc' | 'desc'
  onToggle: (field: string) => void
  align?: 'left' | 'right' | 'center'
  className?: string
}

export default function SortableHeader({
  field,
  label,
  currentSort,
  direction,
  onToggle,
  align = 'left',
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort === field
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

  return (
    <th
      className={`px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors ${alignClass} ${className}`}
      onClick={() => onToggle(field)}
    >
      <span className="flex items-center gap-1" style={{ justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
        {label}
        {isActive ? (
          direction === 'desc' ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-20" />
        )}
      </span>
    </th>
  )
}
