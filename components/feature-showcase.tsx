'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

// Screenshots live in /public/screenshots (1920×1080). Filenames must match exactly.
const SHOTS = [
  { src: '/screenshots/screener-pro.png',             title: 'Screener Pro',              desc: 'Saring 900+ saham IDX dengan 15+ sinyal smart money dalam satu tampilan.' },
  { src: '/screenshots/foreign-flow-inteligence.png', title: 'Foreign Flow Intelligence', desc: 'Harga vs kumulatif net foreign, lengkap dengan aliran asing harian per saham.' },
  { src: '/screenshots/screener-msci.png',            title: 'MSCI Eligibility Screener', desc: 'Deteksi kandidat masuk/keluar indeks MSCI + saham yang hampir lolos.' },
  { src: '/screenshots/screener-ftse.png',            title: 'FTSE GEIS Screener',        desc: 'Kelayakan FTSE: uji likuiditas X/12 bulan, free float, & ukuran.' },
  { src: '/screenshots/broker-summary.png',           title: 'Broker Summary & Tracker',  desc: 'Bedah broker dominan & konsistensi akumulasi/distribusi per saham.' },
  { src: '/screenshots/group-inteligence.png',        title: 'Group Intelligence',        desc: 'Aliran dana per grup konglomerat — Barito, Sinarmas, Salim, dll.' },
  { src: '/screenshots/ksei-1persen-inteligence.png', title: 'KSEI >1% Intelligence',     desc: 'Kepemilikan KSEI >1%, stealth accumulation, & perubahan bulanan.' },
  { src: '/screenshots/screener-breakout.png',        title: 'Breakout Scanner',          desc: 'Volume & AOV anomaly + breakout teknikal untuk timing entry.' },
  { src: '/screenshots/backtest-lab.png',             title: 'Backtest Lab',              desc: 'Uji strategi pada data historis sebelum pakai modal nyata.' },
  { src: '/screenshots/right-issue-calc.png',         title: 'Right Issue Calculator',    desc: 'Hitung dampak rights issue, harga teoretis, & dilusi.' },
]

function Shot({ src, title, desc }: { src: string; title: string; desc: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/[0.06] card-hover">
      <div className="relative aspect-[16/9] bg-gradient-to-br from-white/[0.05] to-transparent border-b border-white/[0.05]">
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
          Lihat langsung dari dalam platform
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
