'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props<T> { data: T[]; columns: ColumnDef<T, any>[]; pageSize?: number; onRowClick?: (row: T) => void; emptyText?: string }

export function DataTable<T>({ data, columns, pageSize = 25, onRowClick, emptyText = 'No data' }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize } } })

  if (data.length === 0) return <div className="text-center text-muted-foreground py-12 text-sm">{emptyText}</div>

  return (
    <div>
      <div className="overflow-x-auto table-container">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-border/40">
                {hg.headers.map(h => (
                  <th key={h.id} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={h.column.getToggleSortingHandler()}>
                    <span className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> : h.column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> : null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className={`border-b border-border/30 ${onRowClick ? 'tr-hover cursor-pointer' : 'tr-hover'}`} onClick={() => onRowClick?.(row.original)}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
          <span className="text-xs text-muted-foreground">{table.getState().pagination.pageIndex * pageSize + 1}-{Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} of {data.length}</span>
          <div className="flex gap-1">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
