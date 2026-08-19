import React, { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

const NAV = [
  { key: 'inicio', label: 'Inicio', roles: ['admin', 'prestador'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" /> },
  { key: 'subir', label: 'Cargue mensual', roles: ['prestador'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /> },
  { key: 'historial', label: 'Verificar data', roles: ['admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { key: 'historial', label: 'Mis cargues', roles: ['prestador'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { key: 'consolidar', label: 'Consolidar', roles: ['admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" /> },
  { key: 'historias', label: 'Historias clínicas', roles: ['admin', 'prestador'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { key: 'prestadores', label: 'Prestadores', roles: ['admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" /> },
]

const META = {
  inicio: { title: 'Inicio', sub: 'Panel de control' },
  subir: { title: 'Cargue mensual', sub: 'Sube y valida la data' },
  historial: { title: 'Verificar data', sub: 'Cargues de los prestadores' },
  consolidar: { title: 'Consolidar', sub: 'Une las datas' },
  historias: { title: 'Historias clínicas', sub: 'Expedientes clínicos' },
  prestadores: { title: 'Prestadores', sub: 'Usuarios y accesos' },
}
const ROLE_TITLE = { historial: { admin: 'Verificar data', prestador: 'Mis cargues' } }

function Logo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="url(#lg1)" opacity="0.3" />
      <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="url(#lg1)" opacity="0.6" />
      <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="url(#lg1)" />
    </svg>
  )
}

export default function DashboardLayout({ section, onNavigate, children, templates = [], activeTemplate = null, onSelectTemplate }) {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [open, setOpen] = useState(false)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('darkMode', dark) }, [dark])

  const isAdmin = user?.role === 'admin'
  const role = isAdmin ? 'admin' : 'prestador'
  const items = NAV.filter((i) => i.roles.includes(role))
  const meta = META[section] || META.inicio
  const rt = ROLE_TITLE[section]?.[role]
  const activeMeta = templates.find((t) => t.key === activeTemplate)
  if (rt) meta.title = rt

  return (
    <div className="min-h-screen app-bg">
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* ═══ Sidebar verde institucional (integrado) ═══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-gradient-to-b from-[#2E7D32] to-[#256B29] transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[68px] border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Logo />
          </div>
          <div>
            <div className="text-white font-extrabold text-[15px] leading-none tracking-tight">
              Fénix <span className="text-emerald-200">Data</span>
            </div>
            <div className="text-white/50 text-[0.6rem] font-semibold uppercase tracking-[0.18em] mt-1">Recepción de datos</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-thin">
          <div className="text-[0.6rem] font-bold text-white/40 uppercase tracking-[0.2em] px-3 mb-2">Menú principal</div>
          {items.map((item, idx) => {
            const active = section === item.key
            return (
              <button
                key={item.key + idx}
                onClick={() => { onNavigate(item.key); setOpen(false) }}
                className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${
                  active ? 'bg-white text-[#2E7D32]' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#1B5E20]" />}
                <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${active ? 'text-[#2E7D32]' : 'text-white/60'}`}>
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{item.icon}</svg>
                </span>
                <span className={`text-[13px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/10">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#2E7D32] text-sm font-extrabold shrink-0">
              {(user?.name || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white truncate">{user?.name}</div>
              <div className="text-[0.6rem] font-bold text-emerald-200 uppercase tracking-wider">{isAdmin ? 'EPS' : 'Prestador'}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ Contenido ═══ */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar glass */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-[#0B0F14]/70 backdrop-blur-2xl border-b border-slate-200/60 dark:border-[#1A222C]">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="lg:hidden w-10 h-10 rounded-xl bg-white dark:bg-[#131920] border border-slate-200 dark:border-[#1E2733] flex items-center justify-center text-[rgb(var(--ink))]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="hidden lg:block">
                <div className="w-9 h-9 rounded-lg bg-[#2E7D32] flex items-center justify-center">
                  <Logo size={20} />
                </div>
              </div>
              <div>
                <h1 className="text-[17px] font-extrabold text-[rgb(var(--ink))] tracking-tight leading-none">{meta.title}</h1>
                <p className="text-xs text-[rgb(var(--faint))] mt-1 hidden sm:block">
                  {activeMeta ? `${meta.sub} · ${activeMeta.label}` : meta.sub}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <span className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-[#047857] dark:text-[#6EE7B7] border border-emerald-200/70 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAdmin ? 'EPS' : 'Prestador'}
                </span>
              )}
              <button onClick={() => setDark(!dark)} className="w-10 h-10 rounded-xl bg-white dark:bg-[#131920] border border-slate-200 dark:border-[#1E2733] flex items-center justify-center text-[rgb(var(--ink))] hover:border-emerald-500/50 transition-colors">
                {dark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 px-5 text-center">
          <p className="text-[0.6rem] text-[rgb(var(--faint))] uppercase tracking-wider font-semibold">
            Asociación de Cabildos Indígenas del Cesar y La Guajira &mdash; Ing. José Quintero &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}