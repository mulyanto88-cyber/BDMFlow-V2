'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Share, Plus, X } from 'lucide-react'

// The browser fires this (Chrome/Edge/Android) when the PWA meets install
// criteria. It's not in the standard TS lib, so we type the bits we use.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as Mac but has touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /webkit/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
  return iOS && webkit
}

export default function InstallButton() {
  const [mounted, setMounted] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  const ios = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    ios.current = isIosSafari()
    if (isStandalone()) setInstalled(true)

    const onPrompt = (e: Event) => {
      e.preventDefault() // stop Chrome's mini-infobar; we drive our own button
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      setIosHelp(false)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Close the iOS help popover on outside click
  useEffect(() => {
    if (!iosHelp) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setIosHelp(false)
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [iosHelp])

  async function handleInstall() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferred(null) // prompt can only be used once
  }

  // Don't render until mounted (avoid hydration mismatch), and hide once installed.
  if (!mounted || installed) return null

  // Nothing installable to offer (e.g. desktop Firefox, or criteria not met yet)
  if (!deferred && !ios.current) return null

  const btnClass = [
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl',
    'border border-amber-400/30 bg-amber-400/10',
    'hover:bg-amber-400/20 hover:border-amber-400/50',
    'text-amber-300 hover:text-amber-200',
    'transition-all duration-200 text-[11px] font-bold',
    'active:scale-95',
  ].join(' ')

  // iOS Safari: no programmatic prompt — show manual instructions
  if (!deferred && ios.current) {
    return (
      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setIosHelp(v => !v)}
          className={btnClass}
          title="Install BDMFlow"
        >
          <Download size={13} />
          <span>Install</span>
        </button>

        {iosHelp && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl border border-white/[0.08] bg-black/90 backdrop-blur-2xl shadow-2xl z-50 animate-scale-in"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-black text-amber-300 uppercase tracking-wider">Install di iPhone</p>
              <button onClick={() => setIosHelp(false)} className="text-muted-foreground/50 hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <ol className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                Tap tombol <Share size={12} className="inline text-amber-300" /> <span className="font-semibold text-foreground/80">Share</span> di Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                Pilih <Plus size={12} className="inline text-amber-300" /> <span className="font-semibold text-foreground/80">Add to Home Screen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
                Tap <span className="font-semibold text-foreground/80">Add</span> — selesai!
              </li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  // Android / Desktop Chrome / Edge — one-tap install
  return (
    <button onClick={handleInstall} className={btnClass} title="Install BDMFlow App">
      <Download size={13} />
      <span>Install App</span>
    </button>
  )
}
