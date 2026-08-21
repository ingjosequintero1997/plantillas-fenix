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
  const [showPass, setShowPass] = useState(false)
  const passRef = useRef(null)

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }) }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Completa todos los campos.'); return }
    setSubmitting(true); setError('')
    try { await login(username, password) }
    catch (err) { setError(err.message || 'No fue posible iniciar sesión. Verifica tus credenciales.'); passRef.current?.focus() }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Panel de marca (izquierda) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #3A863A 0%, #6BC06B 45%, #8AD998 100%)' }}>
        {/* Watermark phoenix */}
        <svg className="absolute -bottom-24 -right-24 w-[460px] h-[460px] opacity-[0.08]" viewBox="0 0 32 32" fill="none">
          <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="#fff" opacity="0.35" />
          <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="#fff" opacity="0.65" />
          <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="#fff" />
        </svg>
        {/* Resplandor decorativo */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#F4E72B]/20 blur-3xl" />

        <div className="flex items-center gap-3 relative">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1 shadow-lg shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-white font-semibold text-lg leading-none">Fénix Data</div>
            <div className="text-white/70 text-[0.62rem] font-medium tracking-[0.16em] mt-1">RECEPCIÓN DE DATOS</div>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-[2rem] font-bold text-white leading-tight mb-4">
            Recepción y validación de datos para el sector salud.
          </h2>
          <p className="text-white/75 text-sm max-w-sm leading-relaxed">
            Plataforma empresarial para la recepción mensual de plantillas de datos de prestadores, su validación, consolidación y gestión de historias clínicas.
          </p>

          {/* Características */}
          <div className="mt-8 space-y-3">
            {[
              { t: 'Validación automática', d: 'Detección de plantilla y corrección inteligente de datos.' },
              { t: 'Consolidación', d: 'Unifica cargues mensuales en una sola data.' },
              { t: 'Historias clínicas', d: 'Gestión centralizada de expedientes en PDF.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#F4E72B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{f.t}</div>
                  <div className="text-white/60 text-xs mt-0.5">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/55 text-xs relative">
          Asociación de Cabildos Indígenas del Cesar y La Guajira
        </div>
      </div>

      {/* Panel de acceso (derecha) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Marca móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 ring-1 ring-black/5 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-semibold text-lg leading-none" style={{ color: 'var(--text)' }}>Fénix Data</div>
              <div className="text-[0.62rem] font-medium tracking-[0.16em] mt-1" style={{ color: 'var(--text-secondary)' }}>RECEPCIÓN DE DATOS</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Iniciar sesión</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Ingresa con tus credenciales para continuar.</div>
          </div>

          <div className="panel p-7" style={{ boxShadow: '0 8px 30px rgba(16,24,40,0.08)' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Usuario</label>
                <input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  autoFocus
                  autoComplete="username"
                  className="input py-2.5"
                  placeholder="Tu usuario"
                />
              </div>

              <div>
                <label className="form-label">Contraseña</label>
                <div className="relative">
                  <input
                    ref={passRef}
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    autoComplete="current-password"
                    className="input py-2.5 pr-10"
                    placeholder="Tu contraseña"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 mt-2">
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Ingresando...
                  </>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="text-center text-[0.68rem] mt-6" style={{ color: 'var(--text-secondary)' }}>
            Acceso restringido. Sistema para uso autorizado.
          </p>
        </div>
      </div>
    </div>
  )
}