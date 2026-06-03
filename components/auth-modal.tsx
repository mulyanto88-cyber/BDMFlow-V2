'use client'

import { useState } from 'react'
import { X, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

type Mode = 'login' | 'register'

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]     = useState<Mode>('login')
  const [email, setEmail]   = useState('')
  const [password, setPass] = useState('')
  const [name, setName]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoad]  = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoad(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error)
        else onClose()
      } else {
        const { error } = await signUp(email, password, name)
        if (error) setError(error)
        else setSuccess(true)
      }
    } finally {
      setLoad(false)
    }
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000,
               display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'var(--color-background-primary)', borderRadius:'16px',
                    border:'0.5px solid var(--color-border-tertiary)', padding:'28px',
                    width:'100%', maxWidth:'400px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div>
            <h2 style={{ fontSize:'16px', fontWeight:500, color:'var(--color-text-primary)' }}>
              {mode === 'login' ? 'Masuk ke QuantBDM' : 'Daftar QuantBDM'}
            </h2>
            <p style={{ fontSize:'12px', color:'var(--color-text-secondary)', marginTop:'2px' }}>
              {mode === 'login' ? 'Akses dashboard premium IDX' : 'Mulai analisis saham IDX secara gratis'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>📧</div>
            <p style={{ fontSize:'14px', fontWeight:500, color:'var(--color-text-primary)', marginBottom:'6px' }}>Cek email Anda</p>
            <p style={{ fontSize:'12px', color:'var(--color-text-secondary)' }}>
              Kami kirim link konfirmasi ke <strong>{email}</strong>
            </p>
            <button
              onClick={onClose}
              style={{ marginTop:'16px', padding:'8px 20px', borderRadius:'8px',
                       background:'#534AB7', color:'#fff', border:'none', cursor:'pointer', fontSize:'13px' }}
            >
              OK
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Nama</label>
                <div style={{ position:'relative' }}>
                  <User size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--color-text-tertiary)' }} />
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nama lengkap" required
                    style={{ width:'100%', paddingLeft:'32px', paddingRight:'12px', height:'38px',
                             borderRadius:'8px', border:'0.5px solid var(--color-border-secondary)',
                             background:'var(--color-background-primary)', color:'var(--color-text-primary)',
                             fontSize:'13px', boxSizing:'border-box' }}
                  />
                </div>
              </div>
            )}
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--color-text-tertiary)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com" required
                  style={{ width:'100%', paddingLeft:'32px', paddingRight:'12px', height:'38px',
                           borderRadius:'8px', border:'0.5px solid var(--color-border-secondary)',
                           background:'var(--color-background-primary)', color:'var(--color-text-primary)',
                           fontSize:'13px', boxSizing:'border-box' }}
                />
              </div>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--color-text-tertiary)' }} />
                <input
                  type="password" value={password} onChange={e => setPass(e.target.value)}
                  placeholder="Min. 6 karakter" required minLength={6}
                  style={{ width:'100%', paddingLeft:'32px', paddingRight:'12px', height:'38px',
                           borderRadius:'8px', border:'0.5px solid var(--color-border-secondary)',
                           background:'var(--color-background-primary)', color:'var(--color-text-primary)',
                           fontSize:'13px', boxSizing:'border-box' }}
                />
              </div>
            </div>

            {error && (
              <p style={{ fontSize:'12px', color:'var(--color-text-danger)', marginBottom:'12px', background:'var(--color-background-danger)', padding:'8px 10px', borderRadius:'6px' }}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width:'100%', height:'40px', borderRadius:'8px', border:'none',
                       background:'#534AB7', color:'#EEEDFE', fontSize:'13px', fontWeight:500,
                       cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                       display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>

            <p style={{ textAlign:'center', fontSize:'12px', color:'var(--color-text-secondary)', marginTop:'14px' }}>
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                style={{ background:'none', border:'none', color:'#534AB7', cursor:'pointer', fontSize:'12px', fontWeight:500 }}
              >
                {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
