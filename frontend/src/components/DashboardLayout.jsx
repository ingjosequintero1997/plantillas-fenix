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
  { key: 'historias', label: 'Historias clínicas', roles: ['admin', 'prestador', 'lider'],
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-h-screen">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col transition-transform duration-200 lg:sticky lg:translate-x-0 lg:top-0 lg:h-screen lg:z-20 lg:inset-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-default)' }}
        >
          {/* Logo */}
          <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shrink-0" style={{ border: '1px solid var(--border-default)' }}>
              <img src="/logo.png" alt="Fénix" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[0.8125rem] font-semibold" style={{ color: 'var(--text-primary)' }}>Fénix Data</div>
              <div className="text-[0.6rem] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Recepción de datos</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-0.5">
              {items.map((item, idx) => {
                const active = section === item.key
                return (
                  <button
                    key={item.key + idx}
                    onClick={() => { onNavigate(item.key); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-md transition-all relative"
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: active ? '500' : '400',
                      color: active ? 'var(--green-700)' : 'var(--text-secondary)',
                      backgroundColor: active ? 'var(--green-subtle)' : 'transparent',
                      transitionDuration: 'var(--duration)',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ backgroundColor: 'var(--green-500)' }} />}
                    <span className="flex items-center justify-center w-5 h-5 shrink-0" style={{ color: active ? 'var(--green-600)' : 'var(--text-tertiary)' }}>
                      <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* User */}
          <div className="px-3 pb-3 pt-2" ref={userMenuRef} style={{ borderTop: '1px solid var(--border-default)' }}>
            <button onClick={() => setUserMenu((v) => !v)}
              className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-all"
              style={{ backgroundColor: userMenu ? 'var(--bg-surface-hover)' : 'transparent', transitionDuration: 'var(--duration)' }}
              onMouseEnter={(e) => { if (!userMenu) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)' }}
              onMouseLeave={(e) => { if (!userMenu) e.currentTarget.style.backgroundColor = 'transparent' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-semibold shrink-0" style={{ backgroundColor: 'var(--green-subtle)', color: 'var(--green-700)' }}>
                {(user?.name || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.75rem] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
                <div className="text-[0.6rem] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{roleLabel}</div>
              </div>
              <svg className="w-3 h-3 shrink-0 transition-transform" style={{ color: 'var(--text-tertiary)', transform: userMenu ? 'rotate(180deg)' : 'rotate(0deg)', transitionDuration: 'var(--duration)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenu && (
              <div className="mt-1 rounded-lg py-1 fade-in" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="px-3 py-1.5 text-[0.65rem]" style={{ color: 'var(--text-tertiary)' }}>{user?.name} &middot; {roleLabel}</div>
                <button onClick={() => { setUserMenu(false); onNavigate('inicio') }} className="w-full text-left px-3 py-1.5 text-[0.8125rem] transition-colors rounded-md" style={{ color: 'var(--text-primary)', transitionDuration: 'var(--duration)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Mi perfil</button>
                <button onClick={() => { setUserMenu(false); onNavigate('inicio') }} className="w-full text-left px-3 py-1.5 text-[0.8125rem] transition-colors rounded-md" style={{ color: 'var(--text-primary)', transitionDuration: 'var(--duration)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Configuración</button>
                <div className="my-1 mx-2" style={{ borderTop: '1px solid var(--border-default)' }} />
                <button onClick={() => { setUserMenu(false); logout() }} className="w-full text-left px-3 py-1.5 text-[0.8125rem] transition-colors rounded-md" style={{ color: 'var(--danger)', transitionDuration: 'var(--duration)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 h-[52px] flex items-center justify-between px-5 lg:px-8" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="lg:hidden p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-secondary)', transitionDuration: 'var(--duration)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <span className="text-[0.8125rem] font-medium" style={{ color: 'var(--text-primary)' }}>{meta.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[0.6875rem] font-medium" style={{ backgroundColor: 'var(--green-subtle)', color: 'var(--green-700)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green-500)' }} />
                {roleLabel}
              </div>
              <button onClick={() => setDark(!dark)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-tertiary)', transitionDuration: 'var(--duration)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                title="Cambiar tema">
                {dark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-5 lg:px-8 py-6 w-full max-w-[1200px]">
            {children}
          </main>

          <footer className="px-5 lg:px-8 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
            <p className="text-[0.6875rem]" style={{ color: 'var(--text-tertiary)' }}>
              Asociación de Cabildos Indígenas del Cesar y La Guajira &mdash; Ing. José Quintero &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
