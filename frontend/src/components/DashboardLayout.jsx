import React, { useState } from 'react'
import { useAuth } from '../AuthContext'

const NAV_ITEMS = [
  {
    key: 'inicio', label: 'Inicio', desc: 'Resumen', roles: ['admin', 'prestador'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" /></svg>,
  },
  {
    key: 'subir', label: 'Cargue mensual', desc: 'Sube la data del mes', roles: ['prestador'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  },
  {
    key: 'historial', label: 'Verificar data', desc: 'Cargues de los prestadores', roles: ['admin'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: 'historial', label: 'Mis cargues', desc: 'Tu historial', roles: ['prestador'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'consolidar', label: 'Consolidar', desc: 'Une las datas', roles: ['admin'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" /></svg>,
  },
  {
    key: 'historias', label: 'Historias clínicas', desc: 'Expedientes clínicos', roles: ['admin', 'prestador'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: 'prestadores', label: 'Prestadores', desc: 'Usuarios y accesos', roles: ['admin'],
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" /></svg>,
  },
]

const SECTION_META = {
  inicio: { title: 'Inicio', subtitle: 'Resumen de la plataforma' },
  subir: { title: 'Cargue mensual', subtitle: 'Sube la data del mes y valídala' },
  historial: { title: 'Verificar data', subtitle: 'Cargues de los prestadores y su calidad' },
  consolidar: { title: 'Consolidar data', subtitle: 'Une los cargues de todos los prestadores' },
  historias: { title: 'Historias clínicas', subtitle: 'Expedientes clínicos de las usuarias' },
  prestadores: { title: 'Prestadores', subtitle: 'Usuarios y credenciales de acceso' },
}

const SECTION_TITLE_BY_ROLE = {
  historial: { admin: 'Verificar data', prestador: 'Mis cargues' },
}

function Logo({ small }) {
  return (
    <svg className={small ? 'w-5 h-5' : 'w-6 h-6'} viewBox="0 0 32 32" fill="none">
      <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.3" />
      <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.6" />
      <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
    </svg>
  )
}

export default function DashboardLayout({ section, onNavigate, children }) {
  const { user, logout } = useAuth()
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = user?.role === 'admin'
  const role = isAdmin ? 'admin' : 'prestador'
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
  const meta = { ...(SECTION_META[section] || SECTION_META.inicio) }
  const roleTitle = SECTION_TITLE_BY_ROLE[section]?.[role]
  if (roleTitle) meta.title = roleTitle

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('darkMode', next)
  }

  return (
    <div className="min-h-screen app-bg">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ─── Sidebar (siempre oscuro, premium) ─── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-gradient-to-b from-[#0B1613] via-[#0A1210] to-[#081009] border-r border-white/[0.06] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 px-5 h-[68px] border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2E9E4C] to-[#123F20] flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/10">
            <span className="text-white"><Logo /></span>
          </div>
          <div>
            <div className="text-white font-extrabold text-[15px] leading-none tracking-tight">Fénix <span className="text-emerald-400">Data</span></div>
            <div className="text-white/35 text-[0.6rem] font-semibold uppercase tracking-[0.18em] mt-1">Recepción de datos</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto scroll-thin">
          <div className="text-[0.6rem] font-bold text-white/30 uppercase tracking-[0.2em] px-3 mb-3">Menú</div>
          {items.map((item) => {
            const active = section === item.key
            return (
              <button
                key={item.key + (item.roles || []).join('')}
                onClick={() => { onNavigate(item.key); setSidebarOpen(false) }}
                className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 text-left group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-700/80 shadow-[0_4px_16px_rgba(46,158,76,0.35)]'
                    : 'hover:bg-white/[0.06]'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />}
                <span className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 ${
                  active ? 'bg-white/15 text-white' : 'bg-white/[0.05] text-white/50 group-hover:text-white/80'
                }`}>
                  {item.icon('w-[18px] h-[18px]')}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] leading-tight truncate ${active ? 'text-white font-bold' : 'text-white/70 font-semibold'}`}>{item.label}</span>
                  <span className={`block text-[0.65rem] leading-tight truncate ${active ? 'text-emerald-100/80' : 'text-white/30'}`}>{item.desc}</span>
                </span>
              </button>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="relative px-3 pb-4 border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 bg-white/[0.04] ring-1 ring-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E9E4C] to-[#123F20] flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-md shadow-black/30">
              {(user?.name || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white truncate">{user?.name}</div>
              <div className="text-[0.6rem] font-bold text-emerald-400 uppercase tracking-wider">{isAdmin ? 'EPS' : 'Prestador'}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Contenido ─── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0D0F12]/80 backdrop-blur-xl border-b border-[var(--line)] dark:border-[#1C2026]">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl bg-white dark:bg-[#1A1D21] border border-[var(--line)] dark:border-[#2A303A] flex items-center justify-center text-[rgb(var(--ink))]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-[17px] font-extrabold text-[rgb(var(--ink))] tracking-tight leading-none">{meta.title}</h1>
                <p className="text-xs text-[rgb(var(--faint))] mt-1 hidden sm:block">{meta.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <span className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-[#1E6B33] dark:text-[#79CB8A] border border-emerald-200/70 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAdmin ? 'EPS' : 'Prestador'}
                </span>
              )}
              <button onClick={toggleDark} title={darkMode ? 'Modo claro' : 'Modo oscuro'} className="w-9 h-9 rounded-xl bg-white dark:bg-[#1A1D21] border border-[var(--line)] dark:border-[#2A303A] flex items-center justify-center text-[rgb(var(--ink))] hover:border-emerald-500/50 transition-colors">
                {darkMode ? (
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

        <footer className="border-t border-[var(--line)] dark:border-[#1C2026] py-4 px-5 text-center">
          <p className="text-[0.6rem] text-[rgb(var(--faint))] uppercase tracking-wider font-semibold">
            Asociación de Cabildos Indígenas del Cesar y La Guajira &mdash; Ing. José Quintero &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}