import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

const FIELD_CLASS = 'input w-full'
const LABEL_CLASS = 'block text-xs font-medium mb-1.5'

export default function Login() {
  const { isAuthenticated, login, loginIps, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const userRef = useRef(null)
  const passRef = useRef(null)
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('datas-theme', next ? 'dark' : 'light') } catch (e) { /* storage no disponible */ }
  }

  // Backend efectivo (mismo calculo que api.js / AuthContext.getApiBase).
  const apiBase = import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }) }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Leer los valores directo del DOM: el autofill del navegador a veces
    // rellena los campos sin disparar el onChange de React.
    const user = (userRef.current?.value || '').trim()
    const pass = passRef.current?.value || ''
    if (!profile) { setError('Selecciona tu perfil.'); return }
    if (!user || !pass.trim()) { setError('Completa todos los campos.'); return }
    setSubmitting(true); setError('')
    // Limpiar cualquier sesion anterior para que la nueva sea la unica activa.
    logout()
    try {
      let userData = null
      if (profile === 'prestador') {
        // El perfil Prestador incluye tanto al prestador como al usuario IPS.
        try { userData = await loginIps(user, pass) }
        catch { userData = await login(user, pass) }
      } else {
        userData = await login(user, pass)
      }
      const role = userData?.role
      const matches = profile === 'admin' ? role === 'admin'
        : profile === 'lider' ? role === 'lider'
          : (role === 'prestador' || role === 'ips_user')
      if (!matches) {
        logout()
        setError('El perfil seleccionado no coincide con estas credenciales.')
        passRef.current?.focus()
      }
    }
    catch (err) { setError(err.message || 'Credenciales incorrectas.'); passRef.current?.focus() }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-dvh relative flex items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>

      {/* Fondo: tinte de marca suave y uniforme, sin franjas ni manchas */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(1000px 560px at 50% -8%, rgba(90,174,90,0.10), transparent 72%)' }} />

      {/* Interruptor de tema */}
      <button
        type="button"
        onClick={toggleDark}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={dark ? 'Modo claro' : 'Modo oscuro'}
        className="absolute top-4 right-4 z-20 p-2 rounded-xl transition-colors"
        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d={dark ? 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' : 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z'} />
        </svg>
      </button>

      {/* Tarjeta */}
      <div className="relative z-10 w-full max-w-[410px] fade-in">
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="p-7 sm:p-8">
            {/* Logo de la empresa (logo.png trae un patron claro incorporado: se muestra como tarjeta redondeada) */}
            <div className="flex flex-col items-center text-center mb-7">
              <img
                src="/logo.png"
                alt="DUSAKAWI EPSI"
                className="h-20 w-auto object-contain rounded-2xl"
                style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
              />
              <h1 className="mt-5 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Iniciar sesión
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Ingresa con tus credenciales para continuar
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={LABEL_CLASS} style={{ color: 'var(--text-secondary)' }}>Perfil</label>
                <select
                  value={profile}
                  onChange={(e) => { setProfile(e.target.value); setError('') }}
                  className={FIELD_CLASS}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <option value="">Selecciona tu perfil</option>
                  <option value="admin">Administrador</option>
                  <option value="lider">Líder de área</option>
                  <option value="prestador">Prestador / IPS</option>
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS} style={{ color: 'var(--text-secondary)' }}>Usuario</label>
                <input
                  ref={userRef}
                  onChange={() => setError('')}
                  autoFocus
                  autoComplete="username"
                  className={FIELD_CLASS}
                  placeholder="Usuario"
                />
              </div>

              <div>
                <label className={LABEL_CLASS} style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
                <div className="relative">
                  <input
                    ref={passRef}
                    type={showPass ? 'text' : 'password'}
                    onChange={() => setError('')}
                    autoComplete="current-password"
                    className={`${FIELD_CLASS} pr-10`}
                    placeholder="Contraseña"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}{import.meta.env.DEV ? ` · API: ${apiBase}` : ''}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-semibold text-[0.9rem] transition-all disabled:opacity-60 mt-2 hover:brightness-105"
                style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 6px 18px rgba(46,125,50,0.28)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>

        {/* Pie */}
        <p className="text-center text-[0.68rem] mt-5" style={{ color: 'var(--text-muted)' }}>
          Desarrollado por el Ing Jose Quintero
        </p>
      </div>
    </div>
  )
}
