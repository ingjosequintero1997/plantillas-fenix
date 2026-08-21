import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../AuthContext'

const NAV = [
  { key: 'inicio', label: 'Inicio', roles: ['admin', 'prestador', 'lider'],
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10' },
  { key: 'subir', label: 'Cargues de data', roles: ['admin', 'prestador'],
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { key: 'historial', label: 'Verificar data', roles: ['admin', 'lider'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'historial', label: 'Mis cargues', roles: ['prestador'],
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'consolidar', label: 'Consolidar', roles: ['admin', 'lider'],
    icon: 'M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z' },
  { key: 'historias', label: 'Historias clinicas', roles: ['admin', 'prestador', 'lider'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'prestadores', label: 'Usuarios', roles: ['admin'],

    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7' },
]

const META = {
  inicio: { title: 'Inicio', sub: 'Centro de operaciones' },
  subir: { title: 'Cargues de data', sub: 'Cargue masivo o mensual' },
  historial: { title: 'Verificar data', sub: 'Cargues de los prestadores' },
  consolidar: { title: 'Consolidar', sub: 'Une las datas' },
  historias: { title: 'Historias clínicas', sub: 'Expedientes clínicos' },
  prestadores: { title: 'Usuarios', sub: 'Prestadores y líderes de programa' },
}
const ROLE_TITLE = { historial: { admin: 'Verificar data', lider: 'Verificar data', prestador: 'Mis cargues' } }

export default function DashboardLayout({ section, onNavigate, children, templates = [], activeTemplate = null }) {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(false)
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => {
    const onClick = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false) }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const isAdmin = user?.role === 'admin'
  const role = user?.role === 'admin' ? 'admin' : user?.role === 'lider' ? 'lider' : 'prestador'
  const roleLabel = user?.role === 'admin' ? 'EPS' : user?.role === 'lider' ? 'Líder' : 'Prestador'
  const items = NAV.filter((i) => i.roles.includes(role))
  const meta = { ...(META[section] || META.inicio) }
  const rt = ROLE_TITLE[section]?.[role]
  if (rt) meta.title = rt
  const activeMeta = templates.find((t) => t.key === activeTemplate)

  return (
    <div className="min-h-screen app-bg flex flex-col">
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <header className="sticky top-0 z-30 w-full" style={{ background: 'linear-gradient(180deg, #166534 0%, #14532D 100%)', boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08)' }}>
        <div className="h-[64px] flex items-center justify-between px-4 lg:px-6 w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-1.5 rounded-md text-white/80 hover:bg-white/10 transition-colors" style={{ transitionDuration: '160ms' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
                <img src="/logo.png" alt="Fénix" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-semibold text-sm leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Fénix Data</div>
                <div className="text-white/50 text-[0.6rem] font-medium tracking-[0.15em] mt-0.5 uppercase">Recepción de datos</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 mr-2 text-white/50 text-xs">
              <span className="text-white/70 font-medium">{meta.title}</span>
              {activeMeta && (
                <>
                  <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  <span className="text-white/50">{activeMeta.label}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              {(isAdmin || role === 'lider') && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[0.65rem] font-medium px-2.5 py-1 rounded-md text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {roleLabel}
                </span>
              )}
              <button onClick={() => setDark(!dark)} className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors" style={{ transitionDuration: '160ms' }} title="Cambiar tema">
                {dark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-strong)', top: '64px', boxShadow: '1px 0 0 var(--border-subtle)' }}
        >
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            <div className="px-3 mb-3">
              <span className="section-label" style={{ fontSize: '0.6rem', letterSpacing: '0.12em' }}>Navegación</span>
            </div>
            {items.map((item, idx) => {
              const active = section === item.key
              return (
                <button
                  key={item.key + idx}
                  onClick={() => { onNavigate(item.key); setOpen(false) }}
                  className="relative w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-md transition-all group"
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: active ? '600' : '500',
                    color: active ? 'var(--green-600)' : 'var(--text-secondary)',
                    backgroundColor: active ? 'var(--surface-brand-weak)' : 'transparent',
                    transitionDuration: '160ms',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full" style={{ backgroundColor: 'var(--green-600)' }} />}
                  <span className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors" style={{ color: active ? 'var(--green-600)' : 'var(--text-muted)', backgroundColor: active ? 'var(--surface-brand-weak)' : 'transparent', transitionDuration: '160ms' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}

            <div className="mt-6 mx-2 px-3 py-3 rounded-lg" style={{ backgroundColor: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="section-label" style={{ fontSize: '0.55rem' }}>Soporte</span>
              </div>
              <div className="text-[0.65rem] leading-snug" style={{ color: 'var(--text-muted)' }}>Asoc. Cabildos Indígenas del Cesar y La Guajira</div>
            </div>
          </nav>

          <div className="px-3 pb-4 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }} ref={userMenuRef}>
            <button onClick={() => setUserMenu((v) => !v)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors"
              style={{ backgroundColor: userMenu ? 'var(--bg-surface-hover)' : 'transparent', transitionDuration: '160ms' }}
              onMouseEnter={(e) => { if (!userMenu) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)' }}
              onMouseLeave={(e) => { if (!userMenu) e.currentTarget.style.backgroundColor = 'transparent' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: 'var(--green-600)', color: 'var(--text-on-brand)' }}>
                {(user?.name || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.8rem] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
                <div className="text-[0.6rem] font-medium uppercase tracking-wider" style={{ color: 'var(--green-600)' }}>{roleLabel}</div>
              </div>
              <svg className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: 'var(--text-muted)', transform: userMenu ? 'rotate(180deg)' : 'rotate(0deg)', transitionDuration: '160ms' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenu && (
              <div className="mt-1 rounded-lg py-1 animate-scale-in" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-subtle)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.name} &middot; {roleLabel}</div>
                <button onClick={() => { setUserMenu(false); onNavigate('inicio') }} className="w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: 'var(--text-primary)', transitionDuration: '160ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Mi perfil</button>
                <button onClick={() => { setUserMenu(false); onNavigate('inicio') }} className="w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: 'var(--text-primary)', transitionDuration: '160ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Configuración</button>
                <div className="divider" />
                <button onClick={() => { setUserMenu(false); logout() }} className="w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: 'var(--danger)', transitionDuration: '160ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </aside>

        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 px-6 lg:px-8 py-6 w-full max-w-[1200px]">
            {children}
          </main>
          <footer className="px-6 py-4 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
              Asociación de Cabildos Indígenas del Cesar y La Guajira &mdash; Ing. José Quintero &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}