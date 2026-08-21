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
  historias: { title: 'Historias clinicas', sub: 'Expedientes clinicos' },
  prestadores: { title: 'Usuarios', sub: 'Prestadores y lideres de programa' },
}
const ROLE_TITLE = { historial: { admin: 'Verificar data', lider: 'Verificar data', prestador: 'Mis cargues' } }

const SIDEBAR_W = 260

export default function DashboardLayout({ section, onNavigate, children, templates = [], activeTemplate = null }) {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const isAdmin = user?.role === 'admin'
  const role = user?.role === 'admin' ? 'admin' : user?.role === 'lider' ? 'lider' : 'prestador'
  const roleLabel = user?.role === 'admin' ? 'EPS' : user?.role === 'lider' ? 'Lider' : 'Prestador'
  const items = NAV.filter((i) => i.roles.includes(role))
  const meta = { ...(META[section] || META.inicio) }
  const rt = ROLE_TITLE[section]?.[role]
  if (rt) meta.title = rt

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>

      {/* Header */}
      <header className="shrink-0 z-30 w-full" style={{
        background: 'linear-gradient(160deg, #3A863A 0%, #4A9A4A 30%, #5AAE5A 60%, #6BC06B 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 20px rgba(90,174,90,0.30)',
      }}>
        <div className="h-[52px] flex items-center gap-3 px-4 w-full">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-white/80 hover:bg-white/15 transition-all" style={{ transitionDuration: '120ms' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-white font-semibold text-[0.9rem] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>FENIX DATA</span>
        </div>
      </header>

      {/* Body - fills remaining viewport */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          className="shrink-0 flex flex-col transition-all duration-200 overflow-hidden"
          style={{
            width: open ? SIDEBAR_W : 0,
            backgroundColor: 'var(--bg-surface)',
            boxShadow: open ? '2px 0 12px rgba(0,0,0,0.04)' : 'none',
          }}
        >
          <div className="flex flex-col h-full" style={{ width: SIDEBAR_W }}>

            {/* User */}
            <div className="px-5 pt-5 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[0.75rem] font-bold shrink-0" style={{ backgroundColor: 'var(--green-500)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {(user?.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[0.8rem] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div className="text-[0.65rem] font-medium" style={{ color: 'var(--green-600)' }}>{roleLabel}</div>
                </div>
              </div>
            </div>

            <div className="mx-4 mb-3" style={{ borderTop: '1px solid var(--border-subtle)' }} />

            {/* Nav */}
            <nav className="flex-1 px-3 overflow-y-auto">
              <div className="mb-2 px-2">
                <span className="text-[0.6rem] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Menu</span>
              </div>
              <div className="space-y-1">
                {items.map((item, idx) => {
                  const active = section === item.key
                  return (
                    <button
                      key={item.key + idx}
                      onClick={() => { onNavigate(item.key); setOpen(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all relative"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: active ? '500' : '400',
                        color: active ? 'var(--green-700)' : 'var(--text-secondary)',
                        backgroundColor: active ? 'var(--green-50)' : 'transparent',
                        transitionDuration: '150ms',
                      }}
                      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: 'var(--green-500)' }} />
                      )}
                      <span className="flex items-center justify-center w-5 h-5 shrink-0" style={{ color: active ? 'var(--green-600)' : 'var(--text-muted)' }}>
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? '2' : '1.5'}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Logout */}
            <div className="px-3 pb-4 pt-3 shrink-0">
              <div className="mx-1 mb-3" style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all"
                style={{ fontSize: '0.8125rem', color: 'var(--danger)', transitionDuration: '150ms' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span>Cerrar sesion</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-6">
            {children}
          </main>
          <footer className="shrink-0 px-6 py-3 border-t text-center" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Asociacion de Cabildos Indigenas del Cesar y La Guajira - Ing. Jose Quintero {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}