import React, { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

const MENU_ITEMS = [
  { key: 'inicio', label: 'Inicio', roles: ['admin', 'prestador', 'lider'],
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10' },
]

const OPERACIONES_ITEMS = [
  { key: 'subir', label: 'Validar data', roles: ['admin', 'prestador'],
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { key: 'historial', label: 'Verificar data', roles: ['admin', 'lider'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'historial', label: 'Mis cargues', roles: ['prestador'],
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'consolidar', label: 'Consolidar', roles: ['admin', 'lider'],
    icon: 'M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z' },
]

const GESTION_ITEMS = [
  { key: 'historias', label: 'Historias clinicas', roles: ['admin', 'prestador', 'lider'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'prestadores', label: 'Usuarios', roles: ['admin'],
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7' },
  { key: 'indicadores', label: 'Indicadores', roles: ['admin', 'lider', 'prestador'],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const META = {
  inicio: { title: 'Inicio', sub: 'Centro de operaciones' },
  subir: { title: 'Validar data', sub: 'Validar y cargar data' },
  formulario: { title: 'Cargue mensual', sub: 'Registro de gestante por formulario' },
  historial: { title: 'Verificar data', sub: 'Cargues de los prestadores' },
  consolidar: { title: 'Consolidar', sub: 'Une las datas' },
  historias: { title: 'Historias clinicas', sub: 'Expedientes clinicos' },
  prestadores: { title: 'Usuarios', sub: 'Prestadores y lideres de programa' },
}
const ROLE_TITLE = { historial: { admin: 'Verificar data', lider: 'Verificar data', prestador: 'Mis cargues' } }

const SIDEBAR_W = 260

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all relative"
      style={{
        fontSize: '0.8rem',
        fontWeight: active ? '500' : '400',
        color: active ? 'var(--green-700)' : 'var(--text-secondary)',
        backgroundColor: active ? 'var(--green-50)' : 'transparent',
        transitionDuration: '150ms',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ backgroundColor: 'var(--green-500)' }} />
      )}
      <span className="flex items-center justify-center w-5 h-5 shrink-0" style={{ color: active ? 'var(--green-600)' : 'var(--text-muted)' }}>
        <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? '2' : '1.5'}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
      </span>
      <span className="truncate">{item.label}</span>
    </button>
  )
}

function NavSection({ label, items, role, section, onNavigate, onSidebarClose }) {
  const visible = items.filter((i) => i.roles.includes(role))
  if (visible.length === 0) return null
  return (
    <div className="mb-1">
      <div className="px-5 pt-3 pb-1.5">
        <span className="text-[0.58rem] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div className="px-2">
        {visible.map((item, idx) => (
          <NavItem
            key={item.key + idx}
            item={item}
            active={section === item.key}
            onClick={() => { onNavigate(item.key); onSidebarClose() }}
          />
        ))}
      </div>
    </div>
  )
}

export default function DashboardLayout({ section, onNavigate, children, templates = [], activeTemplate = null, onSelectTemplate }) {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const role = user?.role === 'admin' ? 'admin' : user?.role === 'lider' ? 'lider' : 'prestador'
  const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'lider' ? 'Lider' : 'Prestador'
  const meta = { ...(META[section] || META.inicio) }
  const rt = ROLE_TITLE[section]?.[role]
  if (rt) meta.title = rt

  const templateMeta = activeTemplate ? templates.find((t) => t.key === activeTemplate) : null
  const hasTemplate = Boolean(activeTemplate)
  const closeSidebar = () => setOpen(false)

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ width: SIDEBAR_W }}>

      {/* User */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[0.8rem] font-bold shrink-0" style={{ backgroundColor: 'var(--green-500)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {(user?.name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[0.8rem] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
            <div className="text-[0.65rem] font-medium" style={{ color: 'var(--green-600)' }}>{roleLabel}</div>
          </div>
        </div>
      </div>

      <div className="mx-4" style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">

        {/* Menu: siempre visible */}
        <NavSection label="Menu" items={MENU_ITEMS} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} />

        {/* Plantilla activa: indicador */}
        {hasTemplate && templateMeta && (
          <div className="mb-1">
            <div className="px-5 pt-3 pb-1.5">
              <span className="text-[0.58rem] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Plantilla</span>
            </div>
            <div className="mx-2 mb-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--green-50)', border: '1px solid var(--green-100)' }}>
                <span className="flex items-center justify-center w-5 h-5 shrink-0" style={{ color: 'var(--green-600)' }}>
                  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                <span className="truncate text-[0.8rem] font-medium" style={{ color: 'var(--green-700)' }}>{templateMeta.label}</span>
              </div>
              {templates.length > 1 && (
                <button
                  onClick={() => { if (onSelectTemplate) onSelectTemplate(''); onNavigate('inicio') }}
                  className="w-full text-left px-3 py-1.5 mt-0.5 text-[0.7rem] rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--green-600)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Cambiar plantilla
                </button>
              )}
            </div>
          </div>
        )}

        {/* Operaciones y Gestion: solo si hay plantilla activa */}
        {hasTemplate && (
          <>
            <NavSection label="Operaciones" items={OPERACIONES_ITEMS} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} />
            <NavSection label="Gestion" items={GESTION_ITEMS} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} />
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="shrink-0 px-2 pb-3">
        <div className="mx-3 mb-2" style={{ borderTop: '1px solid var(--border-subtle)' }} />
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all"
          style={{ fontSize: '0.8rem', color: 'var(--danger)', transitionDuration: '150ms' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg className="w-[17px] h-[17px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>Cerrar sesion</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>

      {/* Header */}
      <header className="shrink-0 z-30 w-full" style={{
        background: 'linear-gradient(160deg, #3A863A 0%, #4A9A4A 30%, #5AAE5A 60%, #6BC06B 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 20px rgba(90,174,90,0.30)',
      }}>
        <div className="h-[48px] flex items-center gap-3 px-4 w-full">
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-white/80 hover:bg-white/15 transition-all" style={{ transitionDuration: '120ms' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-white font-semibold text-[0.85rem] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>FENIX DATA</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          className="shrink-0 flex flex-col transition-all duration-200 overflow-hidden"
          style={{
            width: open ? SIDEBAR_W : 0,
            backgroundColor: 'var(--bg-surface)',
            boxShadow: open ? '2px 0 16px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          {sidebarContent}
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
