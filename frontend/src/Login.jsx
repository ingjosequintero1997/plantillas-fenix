import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState(null)
  const passRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Completa todos los campos')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
      passRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F5F3EF] dark:bg-[#0D0D0F] flex items-center justify-center p-6 overflow-hidden">

      {/* ─── Animated gradient orbs ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[60vmax] h-[60vmax] rounded-full bg-gradient-to-br from-brand-200/30 via-brand-300/20 to-transparent dark:from-brand-800/20 dark:via-brand-700/10 animate-[spin_40s_linear_infinite]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[50vmax] h-[50vmax] rounded-full bg-gradient-to-tr from-amber-200/20 via-amber-300/10 to-transparent dark:from-amber-900/15 dark:via-amber-800/10 animate-[spin_50s_linear_infinite_reverse]" />
        <div className="absolute top-1/3 right-1/3 w-[30vmax] h-[30vmax] rounded-full bg-gradient-to-br from-brand-100/20 to-transparent dark:from-brand-900/10 animate-[spin_30s_linear_infinite]" style={{ animationDelay: '-15s' }} />
      </div>

      {/* ─── Dot grid ─── */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#2E7D32" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
        </svg>
      </div>

      {/* ─── Phoenix watermark tiled ─── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="phx-tile" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <g transform="translate(60,60) scale(1.8)" fill="#2E7D32" opacity="0.06" className="dark:opacity-[0.08]">
                <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" opacity="0.35" />
                <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" opacity="0.65" />
                <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#phx-tile)" />
        </svg>
      </div>

      {/* ─── Card ─── */}
      <div className="relative w-full max-w-sm animate-fade-in-up">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 shadow-xl shadow-brand-900/30 flex items-center justify-center ring-1 ring-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tl from-white/10 to-transparent" />
            <svg className="w-8 h-8 text-white relative z-10 drop-shadow-sm" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.35" />
              <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.65" />
              <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">FÉNIX</h1>
          <p className="text-sm text-ink-muted/70 mt-1.5 font-medium">Validador de Plantillas PYM</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-[#2A2A2E]/95 backdrop-blur-xl rounded-2xl border border-ink-line/50 dark:border-[#555558]/50 shadow-xl dark:shadow-black/40 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                focused === 'user' || username
                  ? '-top-2.5 text-[0.55rem] bg-white dark:bg-[#2A2A2E] px-1.5 text-brand-700 dark:text-brand-400 font-bold uppercase tracking-[0.15em]'
                  : 'top-3 text-sm text-ink-muted/60'
              }`}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                onFocus={() => setFocused('user')}
                onBlur={() => setFocused(null)}
                autoFocus
                autoComplete="username"
                className={`w-full rounded-xl border-2 bg-transparent px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 ${
                  focused === 'user' || username
                    ? 'border-brand-400/60 dark:border-brand-500/60 ring-2 ring-brand-400/10 dark:ring-brand-500/10'
                    : 'border-ink-line/70 dark:border-[#555558] hover:border-ink-line dark:hover:border-[#666669]'
                } ${error ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/10' : ''}`}
              />
            </div>

            <div className="relative">
              <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                focused === 'pass' || password
                  ? '-top-2.5 text-[0.55rem] bg-white dark:bg-[#2A2A2E] px-1.5 text-brand-700 dark:text-brand-400 font-bold uppercase tracking-[0.15em]'
                  : 'top-3 text-sm text-ink-muted/60'
              }`}>
                Contraseña
              </label>
              <input
                ref={passRef}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                autoComplete="current-password"
                className={`w-full rounded-xl border-2 bg-transparent px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 ${
                  focused === 'pass' || password
                    ? 'border-brand-400/60 dark:border-brand-500/60 ring-2 ring-brand-400/10 dark:ring-brand-500/10'
                    : 'border-ink-line/70 dark:border-[#555558] hover:border-ink-line dark:hover:border-[#666669]'
                } ${error ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/10' : ''}`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/50 px-4 py-3 animate-slide-down">
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 leading-tight">{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="relative w-full rounded-xl bg-gradient-to-br from-brand-700 to-brand-800 hover:from-brand-600 hover:to-brand-700 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/25 hover:shadow-xl hover:shadow-brand-900/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tl from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[0.5rem] text-ink-faint/60 mt-8 uppercase tracking-[0.15em] font-semibold leading-relaxed">
          Desarrollado por el Ing. José Quintero<br />
          <span className="text-ink-faint/40">Todos los derechos reservados &copy; {new Date().getFullYear()}</span>
        </p>
      </div>
    </div>
  )
}
