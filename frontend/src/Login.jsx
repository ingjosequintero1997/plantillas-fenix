import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F5F3EF] dark:bg-[#0D0D0F] flex items-center justify-center p-6 overflow-hidden transition-colors duration-500">

      {/* ─── Gradient orbs ─── */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-200/20 dark:bg-brand-800/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-200/15 dark:bg-amber-900/10 blur-3xl" />

      {/* ─── Dot grid ─── */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="#2E7D32" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>
      </div>

      {/* ─── Phoenix tiled pattern ─── */}
      <div className="absolute inset-0 pointer-events-none select-none text-brand-800/20 dark:text-white/[0.12]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="phoenix-tile" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
              <g transform="translate(70,70) scale(2.2)">
                <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.35" />
                <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.65" />
                <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#phoenix-tile)" />
        </svg>
      </div>

      {/* ─── Card ─── */}
      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 shadow-lg shadow-brand-900/25 flex items-center justify-center ring-1 ring-white/10">
            <svg className="w-8 h-8 text-white" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.35" />
              <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.65" />
              <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">FÉNIX</h1>
          <p className="text-sm text-ink-muted/80 mt-1.5">Validador de Plantillas PYM</p>
        </div>

        <div className="bg-white dark:bg-[#333337] rounded-2xl border border-ink-line/50 dark:border-[#666669]/50 shadow-lg dark:shadow-black/40 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[0.55rem] font-bold uppercase tracking-[0.15em] text-ink-muted">Usuario</label>
              <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Ingresa tu usuario" autoFocus autoComplete="username" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[0.55rem] font-bold uppercase tracking-[0.15em] text-ink-muted">Contraseña</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Ingresa tu contraseña" autoComplete="current-password" className="input" />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/50 px-4 py-3 animate-slide-down">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="btn-primary w-full justify-center py-3 text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
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

        <p className="text-center text-[0.5rem] text-ink-faint mt-8 uppercase tracking-wider font-medium leading-relaxed">
          Desarrollado por el Ing. José Quintero<br />
          Todos los derechos reservados &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
