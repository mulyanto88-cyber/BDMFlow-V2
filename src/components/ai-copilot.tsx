'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Bot, X, Send, Sparkles, RefreshCw, Zap, TrendingUp,
  Shield, AlertCircle, ArrowUpRight, CheckCircle2, ChevronRight,
  Maximize2, Minimize2, Copy, Check
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTerminalStore } from '@/store/terminal-store'
import { authFetch } from '@/lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
  timestamp: string
}

const ADMIN_EMAILS = ['mulyanto.my88@gmail.com']

const QUICK_PROMPTS = [
  { label: '🚀 Analisis Scalper Besok', prompt: 'Bedah potensi scalping saham ini untuk trading besok pagi berdasarkan volume surge dan flow semalam.' },
  { label: '🐋 Cek Akumulasi Bandar', prompt: 'Tolong cek detail bandarmologi: siapa broker dominan, fase akumulasi/distribusi, dan konsentrasi barang?' },
  { label: '📊 Valuasi & Fundamental', prompt: 'Bagaimana kesehatan fundamental, rasio PER/PBV/ROE, dan risiko keuangannya?' },
  { label: '🎯 Area Entry & Stop Loss', prompt: 'Buatkan Trading Plan konkret: Area Buy ideal, Target Profit 1 & 2, dan batas ketat Cut Loss.' },
]

export default function AICopilotModal({
  isOpen,
  onClose,
  initialTicker,
}: {
  isOpen: boolean
  onClose: () => void
  initialTicker?: string
}) {
  const { user } = useAuth()
  const { activeTicker } = useTerminalStore()
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  const effectiveTicker = initialTicker || activeTicker || 'BBCA'
  const [ticker, setTicker] = useState(effectiveTicker)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: `Halo Pak Mulyanto! 🤖 **BDMFlow AI Intelligence** siap membantu.
Saat ini konteks aktif disetel ke emiten **${effectiveTicker}**.

Pilih salah satu tombol cepat di bawah atau tanyakan apa saja terkait analisa **Bandarmologi, Foreign Flow, Fundamental**, maupun **Trading Plan Scalper**.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }
  }, [isOpen, effectiveTicker, messages.length])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  if (!isAdmin || !isOpen) return null

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputPrompt
    if (!textToSend.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInputPrompt('')
    setIsLoading(true)
    setConfigError(null)

    try {
      // If user asks about specific stock analysis, call analyze or chat
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          current_ticker: ticker,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.isConfigError) {
          setConfigError(data.error)
        }
        throw new Error(data.error || 'Terjadi kesalahan pada AI API.')
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, modelMsg])
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `⚠️ **Gagal memproses:** ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeStock = async (style: 'COMPREHENSIVE' | 'SCALPER' | 'BANDAR' | 'VALUATION') => {
    if (isLoading) return
    setIsLoading(true)
    setConfigError(null)

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `🔍 Tolong analisa mendalam saham **${ticker}** (Mode: ${style})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await authFetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_code: ticker,
          prompt_style: style,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.isConfigError) {
          setConfigError(data.error)
        }
        throw new Error(data.error || 'Gagal memproses analisa emiten.')
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, modelMsg])
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `⚠️ **Error Analisa:** ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div
        className={`relative w-full ${
          isExpanded ? 'sm:max-w-5xl h-[92vh]' : 'sm:max-w-3xl h-[85vh] sm:h-[750px]'
        } bg-[#0c0d12]/95 border border-amber-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-2xl`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#f59e0b]" />

        {/* ══ HEADER ════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-line-4 bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
              <Bot size={18} className="animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-foreground tracking-tight flex items-center gap-1">
                  BDMFlow AI Intelligence
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    VIP MASTER
                  </span>
                </h3>
              </div>
              <p className="text-[10px] text-muted-foreground">Powered by Gemini 1.5 Flash • IDX Specialist Engine</p>
            </div>
          </div>

          {/* Ticker Selector & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-surface-1 border border-line-3 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Emiten:</span>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="KODE"
                className="w-14 bg-transparent text-xs font-mono font-black text-amber-400 focus:outline-none uppercase"
                maxLength={5}
              />
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-3 transition-colors"
              title={isExpanded ? 'Kecilkan' : 'Perbesar'}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-3 transition-colors active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ══ CONFIG ALERT IF MISSING API KEY ═══════════════════════════════ */}
        {configError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Konfigurasi Kunci API Dibutuhkan:</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Buka file <code className="bg-black/40 px-1 py-0.5 rounded text-amber-400">.env.local</code> di proyek Anda dan tambahkan baris:
                <br />
                <code className="bg-black/60 px-2 py-1 rounded text-white font-mono block mt-1 select-all">
                  GEMINI_API_KEY=AIzaSy...
                </code>
              </p>
            </div>
          </div>
        )}

        {/* ══ CHAT AREA ═════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans text-xs">
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`relative group max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 border shadow-md leading-relaxed ${
                    isUser
                      ? 'bg-amber-500/20 border-amber-500/40 text-foreground font-medium rounded-tr-none'
                      : 'bg-surface-2 border-line-3 text-foreground/90 rounded-tl-none prose prose-invert prose-xs max-w-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-[12px] sm:text-[13px] leading-relaxed select-text">
                    {m.content}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-line-2 text-[9px] text-muted-foreground/60">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
                        title="Salin Analisa"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-amber-400">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-spin">
                <RefreshCw size={14} />
              </div>
              <div className="flex items-center gap-1.5 bg-surface-2 border border-line-3 px-3.5 py-2 rounded-2xl">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-bold text-[11px] text-muted-foreground">
                  AI sedang membedah data {ticker}…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ══ ACTION BUTTONS / QUICK PROMPTS ════════════════════════════════ */}
        <div className="px-4 sm:px-6 py-2 border-t border-line-3 bg-surface-1/80 shrink-0 space-y-2">
          {/* 1-Click Fast Stock Analyzer Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-black text-amber-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles size={11} /> 1-Click {ticker}:
            </span>
            <button
              onClick={() => handleAnalyzeStock('SCALPER')}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              <Zap size={11} /> Scalper Plan
            </button>
            <button
              onClick={() => handleAnalyzeStock('BANDAR')}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[10px] font-bold shrink-0 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              <TrendingUp size={11} /> Bandarmologi
            </button>
            <button
              onClick={() => handleAnalyzeStock('COMPREHENSIVE')}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              <Shield size={11} /> Analisis 360°
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded-md bg-surface-3 hover:bg-surface-4 border border-line-2 text-muted-foreground hover:text-foreground text-[10px] shrink-0 transition-all active:scale-95 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Tanyakan strategi, bandarmologi, atau scalper plan ${ticker}…`}
              disabled={isLoading}
              className="flex-1 bg-surface-2 border border-line-4 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-amber-500/20"
            >
              <span>Kirim</span>
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
