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
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12" style={{ backgroundColor: 'var(--primary-dark)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-white font-semibold text-lg leading-none">Fénix Data</div>
            <div className="text-white/50 text-[0.62rem] font-medium tracking-[0.16em] mt-1">RECEPCIÓN DE DATOS</div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white leading-snug mb-3">
            Recepción y validación de datos<br />para el sector salud.
          </h2>
          <p className="text-white/60 text-sm max-w-sm leading-relaxed">
            Plataforma empresarial para la recepción mensual de plantillas de datos de prestadores, su validación, consolidación y gestión de historias clínicas.
          </p>
        </div>

        <div className="text-white/40 text-xs">
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
            <div className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Iniciar sesión</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Ingresa con tus credenciales para continuar.</div>
          </div>

          <div className="panel p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Usuario</label>
                <input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  autoFocus
                  autoComplete="username"
                  className="input"
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
                    className="input pr-10"
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

              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
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