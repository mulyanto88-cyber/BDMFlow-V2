// Shared layout for legal/compliance pages (terms, privacy, contact).
// Public, server-rendered, no app shell — keeps the design tokens consistent.
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen text-foreground" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950">B</span>
          ← Kembali ke BDMFlow
        </Link>

        <h1 className="mt-6 text-2xl md:text-3xl font-black">{title}</h1>
        {updated && (
          <p className="mt-2 text-xs text-muted-foreground/60">Terakhir diperbarui: {updated}</p>
        )}

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">{children}</div>

        <div className="mt-12 pt-6 border-t border-border/20 text-[11px] text-muted-foreground/40 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>© 2026 BDMFlow — IDX Flow Intelligence</span>
          <span>·</span>
          <a href="mailto:mulyanto.my88@gmail.com" className="hover:text-muted-foreground/70 transition-colors">mulyanto.my88@gmail.com</a>
          <span>·</span>
          <a href="tel:+6285782672208" className="hover:text-muted-foreground/70 transition-colors">+62 857-8267-2208</a>
        </div>
      </div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}
