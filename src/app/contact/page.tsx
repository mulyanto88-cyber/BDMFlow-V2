import type { Metadata } from 'next'
import { Mail, MessageCircle, Clock } from 'lucide-react'
import LegalPage from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Kontak — BDMFlow',
  description: 'Hubungi tim BDMFlow untuk dukungan, kerja sama, atau pertanyaan.',
}

export default function ContactPage() {
  return (
    <LegalPage title="Kontak" updated="15 Agustus 2026">
      <p>
        Ada pertanyaan, kendala teknis, atau ingin kerja sama (API, data institutional, afiliasi)?
        Tim BDMFlow siap membantu.
      </p>

      <div className="space-y-4">
        <a
          href="mailto:mulyanto.my88@gmail.com"
          className="glass rounded-xl border border-line-3 p-5 flex items-center gap-4 hover:border-gold-400/30 transition-colors"
        >
          <span className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-primary" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</div>
            <div className="text-sm font-bold text-foreground break-all">mulyanto.my88@gmail.com</div>
          </div>
        </a>

        <a
          href="https://wa.me/6285782672208"
          target="_blank"
          rel="noopener noreferrer"
          className="glass rounded-xl border border-line-3 p-5 flex items-center gap-4 hover:border-gold-400/30 transition-colors"
        >
          <span className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <MessageCircle size={16} className="text-emerald-400" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp / Telepon</div>
            <div className="text-sm font-bold text-foreground">+62 857-8267-2208</div>
          </div>
        </a>

        <div className="glass rounded-xl border border-line-3 p-5 flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-sky-400" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Waktu Respons</div>
            <div className="text-sm font-bold text-foreground">Maksimal 1&times;24 jam (hari kerja)</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/60">
        Jam operasional: Senin–Jumat, 08.00–20.00 WIB (pesan di luar jam tetap dibalas pada
        hari kerja berikutnya).
      </p>
    </LegalPage>
  )
}
