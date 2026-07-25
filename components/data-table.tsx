'use client'

import { useState, useRef, useMemo } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyText?: string
  virtualize?: boolean
  virtualHeight?: number
}

export function DataTable<T>({
  data, columns, pageSize = 25, onRowClick, emptyText = 'No data',
  virtualize = false, virtualHeight = 520,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: virtualize ? undefined : getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const rows = table.getRowModel().rows

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
    overscan: 10,
    enabled: virtualize,
  })

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-line-5 rounded-2xl bg-surface-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{emptyText}</p>
    </div>
  )

  const headerEl = (
    <thead>
      {table.getHeaderGroups().map(hg => (
        <tr key={hg.id} className="border-b border-line-4 bg-surface-2 backdrop-blur-md sticky top-0 z-10">
          {hg.headers.map(h => (
            <th
              key={h.id}
              className="px-3.5 py-3 text-left text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest select-none cursor-pointer whitespace-nowrap hover:text-foreground transition-colors"
              onClick={h.column.getToggleSortingHandler()}
            >
              <span className="flex items-center gap-1.5">
                {flexRender(h.column.columnDef.header, h.getContext())}
                {h.column.getIsSorted() === 'asc' ? (
                  <ChevronUp size={13} className="text-amber-400 shrink-0" />
                ) : h.column.getIsSorted() === 'desc' ? (
                  <ChevronDown size={13} className="text-amber-400 shrink-0" />
                ) : null}
              </span>
            </th>
          ))}
        </tr>
      ))}
    </thead>
  )

  const renderRow = (row: typeof rows[0]) => (
    <tr
      key={row.id}
      className={`group transition-colors duration-150 ${
        onRowClick
          ? 'hover:bg-amber-500/[0.06] cursor-pointer'
          : 'hover:bg-surface-2'
      }`}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map(cell => (
        <td key={cell.id} className="px-3.5 py-2.5 whitespace-nowrap text-foreground/90 font-medium group-hover:text-foreground">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  )

  if (virtualize) {
    const totalSize = rowVirtualizer.getTotalSize()
    const virtualRows = rowVirtualizer.getVirtualItems()

    return (
      <div className="rounded-xl border border-line-4 bg-card/60 backdrop-blur-xl overflow-hidden shadow-glass-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs border-collapse">
            {headerEl}
          </table>
        </div>
        <div
          ref={scrollRef}
          className="overflow-auto custom-scrollbar"
          style={{ height: virtualHeight }}
        >
          <table className="w-full text-xs border-collapse">
            <tbody>
              {virtualRows.length > 0 && (
                <tr style={{ height: virtualRows[0].start }} />
              )}
              {virtualRows.map(vr => {
                const row = rows[vr.index]
                return (
                  <tr
                    key={row.id}
                    ref={rowVirtualizer.measureElement}
                    data-index={vr.index}
                    className={`group transition-colors duration-150 ${
                      onRowClick
                        ? 'hover:bg-amber-500/[0.06] cursor-pointer'
                        : 'hover:bg-surface-2'
                    }`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-3.5 py-2.5 whitespace-nowrap text-foreground/90 font-medium group-hover:text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-line-4 bg-surface-1">
          <span className="text-[11px] font-mono text-muted-foreground">
            <span className="font-bold text-foreground">{data.length.toLocaleString()}</span> baris total
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            {virtualRows.length} baris dirender
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line-4 bg-card/60 backdrop-blur-xl overflow-hidden shadow-glass-md">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs border-collapse">
          {headerEl}
          <tbody className="divide-y divide-line-1">
            {rows.map(row => renderRow(row))}
          </tbody>
        </table>
      </div>
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line-4 bg-surface-1">
          <span className="text-[11px] font-mono text-muted-foreground">
            Row <span className="font-bold text-foreground">{table.getState().pagination.pageIndex * pageSize + 1}</span>-
            <span className="font-bold text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)}</span> of{' '}
            <span className="font-bold text-foreground">{data.length}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-line-5 bg-surface-2 hover:bg-surface-4 disabled:opacity-20 transition-all"
              aria-label="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-line-5 bg-surface-2 hover:bg-surface-4 disabled:opacity-20 transition-all"
              aria-label="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
