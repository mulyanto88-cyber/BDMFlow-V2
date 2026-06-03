'use client'

import { type LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="glass rounded-2xl p-12 border border-border/30 text-center">
      <Icon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      {description && <p className="text-muted-foreground text-sm mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm font-bold hover:bg-primary/30 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
