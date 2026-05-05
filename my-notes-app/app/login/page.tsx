'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      password,
      redirect: false,
    })
    if (res?.ok) {
      router.push('/')
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .login-input {
          width: 100%; background: transparent;
          border: none; border-bottom: 1px solid var(--glass-border);
          outline: none; color: var(--text-primary);
          padding: 0 0 13px 0; caret-color: var(--accent);
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s; letter-spacing: 0.1em;
        }
        .login-input:focus { border-bottom-color: rgba(45,212,191,0.4); }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center">
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="relative z-10 glass" style={{ width: '100%', maxWidth: '380px', margin: '0 24px', padding: '40px 36px' }}>

          {/* Icon */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <Lock size={18} color="var(--accent)" />
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            This is a private knowledge base.
          </p>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="login-input"
            style={{ marginBottom: '24px' }}
          />

          {error && (
            <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '16px' }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
              background: loading ? 'rgba(45,212,191,0.4)' : 'var(--accent)',
              color: '#0e0e11', fontSize: '13px', fontFamily: 'Syne, sans-serif',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 22px var(--accent-glow)', transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </main>
    </>
  )
}