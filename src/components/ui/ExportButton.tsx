'use client'

import { Download } from 'lucide-react'
import { exportToCSV } from '@/lib/export'

interface ExportButtonProps {
  data: Record<string, any>[]
  filename: string
  label?: string
}

export default function ExportButton({ data, filename, label = 'CSV' }: ExportButtonProps) {
  return (
    <button
      onClick={() => exportToCSV(data, filename)}
      disabled={!data.length}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.06] text-[10px] font-semibold hover:border-primary/30 transition-all disabled:opacity-40"
      title="Download CSV"
    >
      <Download className="w-3 h-3 text-primary" />
      {label}
    </button>
  )
}
