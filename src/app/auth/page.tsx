'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const router = useRouter()
  const { user, loading, signIn, signUp } = useAuth()

  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [name, setName]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [submitting, setSub]  = useState(false)
  const [success, setSuccess] = useState(false)

  // Kalau sudah login, redirect ke homepage
  useEffect(() => {
    if (!loading && user) router.replace('/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSub(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error)
        else router.replace('/')
      } else {
        const { error } = await signUp(email, password, name)
        if (error) setError(error)
        else setSuccess(true)
      }
    } finally {
      setSub(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-purple-400" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 mb-4">
            <Shield size={26} className="text-purple-400" />
          </div>
          <h1 className="text-xl font-semibold">QuantBDM</h1>
          <p className="text-xs text-muted-foreground mt-1">IDX Smart Money Intelligence</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6">

          {success ? (
            // ── Success state ─────────────────────────────────────
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-base font-semibold mb-2">Cek Email Anda</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Link konfirmasi dikirim ke<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Setelah konfirmasi, kembali ke halaman ini untuk masuk.
              </p>
              <button
                onClick={() => { setSuccess(false); setMode('login') }}
                className="mt-5 w-full h-10 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                Ke halaman masuk
              </button>
            </div>
          ) : (
            // ── Form ──────────────────────────────────────────────
            <>
              {/* Tab toggle */}
              <div className="flex gap-1 p-1 bg-muted/30 rounded-xl mb-5">
                {(['login','register'] as Mode[]).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError('') }}
                    className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
                      mode === m
                        ? 'bg-card shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {m === 'login' ? 'Masuk' : 'Daftar'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Nama Lengkap</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Nama lengkap" required
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-purple-500/60 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com" required
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-purple-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPass(e.target.value)}
                      placeholder="Min. 6 karakter" required minLength={6}
                      className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-purple-500/60 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPass ? <EyeOff size={13}/> : <Eye size={13}/>}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={submitting}
                  className="w-full h-10 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {mode === 'login' ? 'Masuk' : 'Buat Akun'}
                </button>
              </form>

              {mode === 'login' && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Belum punya akun?{' '}
                  <button onClick={() => { setMode('register'); setError('') }}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    Daftar gratis
                  </button>
                </p>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          © 2025 QuantBDM · IDX Smart Money Intelligence
        </p>
      </div>
    </div>
  )
}
