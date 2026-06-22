'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

// Drop the real screenshots into /public/screenshots with these exact filenames and they replace
// the placeholders automatically. Until then, each slot shows a styled "preview segera" frame.
const SHOTS = [
  { src: '/screenshots/screener.png',       title: 'Screener & MSCI / FTSE Eligibility', desc: 'Saring 900+ saham IDX dengan 15+ sinyal, plus kelayakan indeks global MSCI & FTSE.' },
  { src: '/screenshots/foreign-flow.png',   title: 'Foreign Flow per Saham',             desc: 'Harga vs kumulatif net foreign 120 hari, lengkap dengan aliran asing harian.' },
  { src: '/screenshots/smart-money.png',    title: 'Smart Money & Bandarmologi',         desc: 'Lacak akumulasi institusi, whale signal, dan big-player anomaly.' },
  { src: '/screenshots/broker-tracker.png', title: 'Broker Tracker',                     desc: 'Bedah broker dominan & konsistensi akumulasi/distribusi per saham.' },
]

function Shot({ src, title, desc }: { src: string; title: string; desc: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/[0.06] card-hover">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-white/[0.05] to-transparent border-b border-white/[0.05]">
        {err ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/35">
            <ImageIcon size={26} strokeWidth={1.4} />
            <span className="text-[11px] font-bold text-muted-foreground/50">{title}</span>
            <span className="text-[9px] uppercase tracking-widest">Preview segera</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Screenshot — ${title}`}
            loading="lazy"
            onError={() => setErr(true)}
            className="w-full h-full object-cover object-top"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[13px] font-black text-foreground">{title}</h3>
        <p className="text-[11.5px] text-muted-foreground/65 leading-relaxed mt-1">{desc}</p>
      </div>
    </div>
  )
}

export default function FeatureShowcase() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">
          Cuplikan Platform
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-foreground">
          Lihat langsung, bukan sekadar janji
        </h2>
        <p className="text-sm text-muted-foreground/65 max-w-xl mx-auto">
          Tampilan nyata fitur-fitur BDMFlow IDX — daftar gratis untuk mengakses semuanya.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {SHOTS.map(s => <Shot key={s.src} {...s} />)}
      </div>
    </section>
  )
}
