import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../AuthContext'

const NAV = [
  { key: 'inicio', label: 'Inicio', roles: ['admin', 'prestador', 'lider'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" /> },
  { key: 'subir', label: 'Cargues de data', roles: ['admin', 'prestador'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /> },
  { key: 'historial', label: 'Verificar data', roles: ['admin', 'lider'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { key: 'historial', label: 'Mis cargues', roles: ['prestador'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { key: 'consolidar', label: 'Consolidar', roles: ['admin', 'lider'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" /> },
  { key: 'historias', label: 'Historias clínicas', roles: ['admin', 'prestador', 'lider'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { key: 'prestadores', label: 'Usuarios', roles: ['admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" /> },
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

function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="#fff" opacity="0.35" />
      <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="#fff" opacity="0.65" />
      <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="#fff" />
    </svg>
  )
}

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
  const meta = META[section] || META.inicio
  const rt = ROLE_TITLE[section]?.[role]
  if (rt) meta.title = rt
  const activeMeta = templates.find((t) => t.key === activeTemplate)

  return (
    <div className="min-h-screen app-bg flex">
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ═══ Sidebar ═══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#69C455' }}>
        {/* Branding */}
        <div className="flex items-center gap-3 px-5 h-[72px] border-b border-white/20">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-white font-bold text-[15px] leading-none tracking-tight">Fénix Data</div>
            <div className="text-white/70 text-[0.6rem] font-bold tracking-[0.16em] mt-1">RECEPCIÓN DE DATOS</div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[0.6rem] font-bold text-white/60 uppercase tracking-[0.14em] px-3 mb-2">Menú</div>
          {items.map((item, idx) => {
            const active = section === item.key
            return (
              <button
                key={item.key + idx}
                onClick={() => { onNavigate(item.key); setOpen(false) }}
                className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                  active ? 'font-bold text-white bg-white/25' : 'font-semibold text-white hover:bg-white/15'
                }`}
              >
                <span className="flex items-center justify-center w-5 h-5 shrink-0">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">{item.icon}</svg>
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="px-3 pb-4 border-t border-white/20 pt-3" ref={userMenuRef}>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-white/20 text-white">
              {(user?.name || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold truncate text-white">{user?.name}</div>
              <div className="text-[0.6rem] font-bold uppercase tracking-wider text-white/70">{roleLabel}</div>
            </div>
            <button onClick={() => setUserMenu((v) => !v)} className="p-1.5 rounded-md text-white/70 hover:bg-white/15 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" />
              </svg>
            </button>
          </div>

          {/* Menú contextual de usuario */}
          {userMenu && (
            <div className="mt-2 rounded-lg py-1" style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
              <div className="px-3 py-2 border-b text-[0.65rem] text-gray-500 border-gray-100">{user?.name} · {roleLabel}</div>
              <button onClick={() => { setUserMenu(false); onNavigate('inicio') }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Mi perfil</button>
              <button onClick={() => { setUserMenu(false); onNavigate('inicio') }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Configuración</button>
              <div className="divider" />
              <button onClick={() => { setUserMenu(false); logout() }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Cerrar sesión</button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══ Contenido ═══ */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', boxShadow: '0 1px 3px rgba(16,24,40,0.04)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <div className="page-title">{meta.title}</div>
              <div className="page-subtitle">{meta.sub}{activeMeta ? ` · ${activeMeta.label}` : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(isAdmin || role === 'lider') && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                {roleLabel}
              </span>
            )}
            <button onClick={() => setDark(!dark)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors" title="Cambiar tema">
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 px-6 py-6 w-full max-w-[1200px] mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[0.68rem] text-[var(--text-secondary)]">
            Asociación de Cabildos Indígenas del Cesar y La Guajira &mdash; Ing. José Quintero &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}