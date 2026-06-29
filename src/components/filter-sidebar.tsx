'use client'

import { useState } from 'react'
import { Filter, X, ChevronRight } from 'lucide-react'

interface FilterSidebarProps {
  title?: string
  children: React.ReactNode
}

export default function FilterSidebar({ title = 'Filter', children }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle Button (Visible only on mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 transition-colors w-full mb-4"
      >
        <Filter size={16} className="text-gold-400" />
        {title}
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={[
        'fixed md:sticky top-0 md:top-[72px] left-0 z-50 md:z-10 h-full md:h-[calc(100vh-80px)] w-[280px] flex flex-col transition-transform duration-300',
        'bg-[#0a0d14] md:bg-transparent border-r md:border border-white/[0.06] md:rounded-2xl',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ].join(' ')}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {children}
        </div>
      </aside>
    </>
  )
}
