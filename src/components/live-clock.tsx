'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function LiveClock() {
  const [time, setTime]   = useState('')
  const [date, setDate]   = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const tick = () => {
      const now = new Date()
      setTime(format(now, 'HH:mm:ss'))
      setDate(format(now, 'EEE, dd MMM yyyy', { locale: id })) // Sekarang 'id' di sini merujuk ke locale Indonesia dengan benar
    }

    tick()
    // Mengubah nama variabel dari 'id' menjadi 'timer' agar tidak bentrok
    const timer = setInterval(tick, 1000) 
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02]"
        aria-live="polite"
        aria-label="Waktu sekarang"
      >
        <span className="font-mono text-[11px] font-semibold text-foreground/80 tracking-widest tabular-nums">
          {time}
        </span>
        <span className="text-muted-foreground/30 text-[10px]">WIB</span>
      </div>
      <span className="hidden lg:block text-[10.5px] text-muted-foreground/40 capitalize">
        {date}
      </span>
    </div>
  )
}
