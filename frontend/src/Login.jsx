import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Login() {
  const { isAuthenticated, login, loginIps } = useAuth()
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
    try {
      try { await loginIps(username, password) }
      catch { await login(username, password) }
    }
    catch (err) { setError(err.message || 'Credenciales incorrectas.'); passRef.current?.focus() }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f5f0' }}>
      {/* Panel izquierdo - branding institucional */}
      <div
        className="hidden lg:flex flex-col items-center justify-between w-[48%] p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2d6e2d 0%, #3a863a 40%, #4a9a4a 100%)',
        }}
      >
        {/* Patron decorativo sutil */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Contenido central */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/logo.png"
              alt="Logo Dusakawi"
              className="w-44 h-44 object-contain drop-shadow-lg"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>

          {/* Texto institucional */}
          <h1 className="text-white text-3xl font-extrabold text-center leading-tight tracking-wide"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            DUSAKAWI EPSI
          </h1>
          <p className="text-white/85 text-sm text-center mt-3 max-w-xs leading-relaxed font-medium">
            ASOCIACIÓN DE CABILDOS INDÍGENAS<br/>DEL CESAR Y LA GUAJIRA
          </p>

          {/* Linea decorativa */}
          <div className="w-16 h-1 rounded-full bg-[#F4E72B] mt-6 opacity-80" />
        </div>

        {/* Pie */}
        <div className="text-white/50 text-[0.65rem] text-center relative z-10">
          Fénix Data &middot; Sistema de Recepción de Datos
        </div>
      </div>

      {/* Panel derecho - formulario de acceso */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ backgroundColor: '#fafaf7' }}>
        <div className="w-full max-w-sm">
          {/* Marca móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1 ring-1 ring-black/5 shadow shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none" style={{ color: '#2d6e2d' }}>Fénix Data</div>
              <div className="text-[0.62rem] font-medium tracking-[0.16em] mt-1" style={{ color: '#666' }}>RECEPCIÓN DE DATOS</div>
            </div>
          </div>

          {/* Titulo */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Iniciar sesión</h2>
            <p className="text-sm mt-1.5" style={{ color: '#666' }}>Ingresa con tus credenciales para continuar.</p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#444' }}>Usuario</label>
                <input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  autoFocus
                  autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a863a]/30 focus:border-[#3a863a] transition-all"
                  placeholder="Tu usuario"
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#444' }}>Contraseña</label>
                <div className="relative">
                  <input
                    ref={passRef}
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#3a863a]/30 focus:border-[#3a863a] transition-all"
                    placeholder="Tu contraseña"
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
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
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm bg-red-50 text-red-700 border border-red-100">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-[0_2px_8px_rgba(58,134,58,0.3)] hover:shadow-[0_4px_16px_rgba(58,134,58,0.4)] hover:translate-y-[-1px]"
                style={{ backgroundColor: '#3a863a' }}
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

          {/* Pie */}
          <p className="text-center text-[0.68rem] mt-6" style={{ color: '#999' }}>
            Acceso restringido. Sistema para uso autorizado.
          </p>
        </div>
      </div>
    </div>
  )
}
