import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    let anim

    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const dots = Array.from({ length: 65 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      const isDark = document.documentElement.classList.contains('dark')
      const color = isDark ? '255,255,255' : '46,125,50'

      dots.forEach((d, i) => {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0 || d.x > c.width) d.vx *= -1
        if (d.y < 0 || d.y > c.height) d.vy *= -1

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${isDark ? 0.12 : 0.15})`
        ctx.fill()

        for (let j = i + 1; j < dots.length; j++) {
          const dx = d.x - dots[j].x
          const dy = d.y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            ctx.beginPath()
            ctx.moveTo(d.x, d.y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(${color},${(1 - dist / 140) * (isDark ? 0.06 : 0.08)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      anim = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
}

const SUBTITLES = ['Validador de Plantillas PYM', 'Gestión de Indicadores', 'Calidad de Datos']

function Typewriter({ texts }) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[idx]
    let timer
    if (!deleting) {
      if (display.length < current.length) {
        timer = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), 50)
      } else {
        timer = setTimeout(() => setDeleting(true), 2000)
      }
    } else {
      if (display.length > 0) {
        timer = setTimeout(() => setDisplay(display.slice(0, -1)), 30)
      } else {
        setDeleting(false)
        setIdx((i) => (i + 1) % texts.length)
      }
    }
    return () => clearTimeout(timer)
  }, [display, deleting, idx, texts])

  return (
    <span className="text-ink-muted/70">
      {display}
      <span className="inline-block w-[2px] h-[1em] bg-brand-600 dark:bg-brand-400 ml-0.5 animate-pulse align-middle" />
    </span>
  )
}

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const cardRef = useRef(null)
  const passRef = useRef(null)

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }) }, [isAuthenticated, navigate])

  // 3D tilt
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`
    }
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)' }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Completa todos los campos'); return }
    setSubmitting(true); setError('')
    try { await login(username, password) }
    catch (err) { setError(err.message); passRef.current?.focus() }
    finally { setSubmitting(false) }
  }

  const ripple = useCallback((e) => {
    const btn = e.currentTarget
    const r = document.createElement('span')
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    r.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,255,255,0.25);left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;transform:scale(0);animation:ripple 0.6s ease-out forwards;pointer-events:none`
    btn.appendChild(r)
    setTimeout(() => r.remove(), 700)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#F5F3EF] dark:bg-[#0D0D0F] flex items-center justify-center p-6 overflow-hidden">

      {/* Canvas particles */}
      <Particles />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[70vmax] h-[70vmax] rounded-full bg-gradient-to-br from-brand-300/15 via-brand-400/10 to-transparent dark:from-brand-700/15 dark:via-brand-600/10 animate-[spin_60s_linear_infinite]" />
        <div className="absolute -bottom-48 -left-48 w-[60vmax] h-[60vmax] rounded-full bg-gradient-to-tr from-amber-300/10 via-amber-400/8 to-transparent dark:from-amber-800/10 dark:via-amber-700/8 animate-[spin_70s_linear_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vmax] h-[50vmax] rounded-full bg-gradient-to-tr from-brand-200/10 to-transparent dark:from-brand-900/8 animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Phoenix watermark */}
      <div className="absolute inset-0 pointer-events-none select-none z-[1]">
        <svg className="w-full h-full">
          <defs>
            <pattern id="phx-pro" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <g transform="translate(50,50) scale(1.5)" fill="#2E7D32" opacity="0.04" className="dark:opacity-[0.06]">
                <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" opacity="0.35" />
                <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" opacity="0.65" />
                <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#phx-pro)" />
        </svg>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm animate-fade-in-up z-20" ref={cardRef}
        style={{ transition: 'transform 0.1s ease-out', transformStyle: 'preserve-3d' }}>

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-900 shadow-2xl shadow-brand-900/40 flex items-center justify-center ring-[3px] ring-white/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tl from-white/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-300/0 via-brand-300/30 to-brand-300/0 animate-[shimmer_3s_ease-in-out_infinite] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <svg className="w-8 h-8 text-white relative z-10 drop-shadow-lg" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.35" />
              <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.65" />
              <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 dark:from-brand-300 dark:via-brand-400 dark:to-brand-500 bg-clip-text text-transparent">
            FÉNIX
          </h1>
          <p className="text-sm mt-2 h-5 font-medium">
            <Typewriter texts={SUBTITLES} />
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/80 dark:bg-[#2A2A2E]/90 backdrop-blur-2xl rounded-2xl border border-ink-line/40 dark:border-[#555558]/40 shadow-2xl dark:shadow-black/50 p-8 transition-shadow duration-500">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                id="user"
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                autoFocus
                autoComplete="username"
                className="peer w-full rounded-xl border-2 bg-transparent px-3 pt-5 pb-1.5 text-sm text-ink outline-none transition-all duration-200 border-ink-line/70 dark:border-[#555558] hover:border-ink-line dark:hover:border-[#666669] focus:border-brand-500 dark:focus:border-brand-400 focus:ring-[3px] focus:ring-brand-500/10 dark:focus:ring-brand-400/10"
                placeholder=" "
              />
              <label htmlFor="user"
                className="absolute left-3 top-4 text-sm text-ink-muted/50 transition-all duration-200 peer-focus:-top-2.5 peer-focus:text-[0.55rem] peer-focus:text-brand-600 dark:peer-focus:text-brand-400 peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.15em] peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[0.55rem] peer-[:not(:placeholder-shown)]:text-brand-600 dark:peer-[:not(:placeholder-shown)]:text-brand-400 peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.15em] bg-white dark:bg-[#2A2A2E] px-1.5 -ml-1.5">
                Usuario
              </label>
            </div>

            <div className="relative">
              <input
                id="pass"
                ref={passRef}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                className="peer w-full rounded-xl border-2 bg-transparent px-3 pt-5 pb-1.5 text-sm text-ink outline-none transition-all duration-200 border-ink-line/70 dark:border-[#555558] hover:border-ink-line dark:hover:border-[#666669] focus:border-brand-500 dark:focus:border-brand-400 focus:ring-[3px] focus:ring-brand-500/10 dark:focus:ring-brand-400/10"
                placeholder=" "
              />
              <label htmlFor="pass"
                className="absolute left-3 top-4 text-sm text-ink-muted/50 transition-all duration-200 peer-focus:-top-2.5 peer-focus:text-[0.55rem] peer-focus:text-brand-600 dark:peer-focus:text-brand-400 peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.15em] peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[0.55rem] peer-[:not(:placeholder-shown)]:text-brand-600 dark:peer-[:not(:placeholder-shown)]:text-brand-400 peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.15em] bg-white dark:bg-[#2A2A2E] px-1.5 -ml-1.5">
                Contraseña
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50/80 dark:bg-red-950/30 backdrop-blur border border-red-200/80 dark:border-red-800/50 px-4 py-3 animate-slide-down">
                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 leading-tight">{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting}
              onClick={ripple}
              className="relative w-full rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 hover:from-brand-500 hover:to-brand-700 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/30 hover:shadow-xl hover:shadow-brand-900/40 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tl from-white/15 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
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

        <p className="text-center text-[0.5rem] text-ink-faint/50 mt-8 uppercase tracking-[0.15em] font-semibold leading-relaxed">
          Desarrollado por el Ing. José Quintero<br />
          <span className="text-ink-faint/30">Todos los derechos reservados &copy; {new Date().getFullYear()}</span>
        </p>
      </div>

      <style>{`@keyframes ripple { to { transform: scale(4); opacity: 0 } }
@keyframes shimmer { 0% { transform: translateX(-100%) skewX(-20deg) } 100% { transform: translateX(200%) skewX(-20deg) } }`}</style>
    </div>
  )
}
