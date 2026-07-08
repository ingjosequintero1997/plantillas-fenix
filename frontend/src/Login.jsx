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
    <div className="relative min-h-screen bg-[#F5F3EF] dark:bg-[#0D0D0F] flex items-center justify-center p-6 overflow-hidden transition-colors duration-300">

      {/* ─── Background pattern ─── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#1E293B" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* ─── Phoenix watermark ─── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] dark:opacity-[0.06]">
        <svg className="w-[70vmin] h-[70vmin] text-[#1E293B] dark:text-white" viewBox="0 0 32 32" fill="none">
          <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.35" />
          <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.65" />
          <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
        </svg>
      </div>

      {/* ─── Brand ─── */}
      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 shadow-lg shadow-brand-900/25 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">FÉNIX</h1>
          <p className="text-sm text-ink-muted/80 mt-1">Validador de Plantillas PYM</p>
        </div>

        {/* ─── Card ─── */}
        <div className="bg-white dark:bg-[#333337] rounded-2xl border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-7">
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

        {/* ─── Footer ─── */}
        <p className="text-center text-[0.5rem] text-ink-faint mt-8 uppercase tracking-wider font-medium leading-relaxed">
          Desarrollado por el Ing. José Quintero<br />
          Todos los derechos reservados &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
