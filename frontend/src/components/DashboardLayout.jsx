import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useAuth } from '../AuthContext'
import { changePassword } from '../api'

const MENU_ITEMS = [
  { key: 'inicio', label: 'Inicio', roles: ['admin', 'prestador', 'lider'],
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10' },
]

const OPERACIONES_ITEMS = [
  { key: 'subir', label: 'Validar data', roles: ['admin', 'prestador'],
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { key: 'data', label: 'Gestión de data', roles: ['admin', 'prestador', 'lider'],
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { key: 'historial', label: 'Verificar data', roles: ['admin', 'lider'],
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { key: 'consolidar', label: 'Consolidar', roles: ['admin', 'lider'],
    icon: 'M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z' },
  { key: 'indicadores', label: 'Indicadores', roles: ['admin', 'prestador', 'lider'],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const GESTION_ITEMS = [
  { key: 'verificar', label: 'Verificar afiliado', roles: ['admin', 'prestador', 'lider'],
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { key: 'historias', label: 'Historias clínicas', roles: ['admin', 'prestador', 'lider'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'reportes', label: 'Reportes pendientes', roles: ['admin', 'prestador', 'lider'],
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
]

const ADMIN_ITEMS = [
  { key: 'prestadores', label: 'Usuarios', roles: ['admin'],
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7' },
  { key: 'bucket', label: 'Gestión de bucket', roles: ['admin'],
    icon: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z' },
  { key: 'configuracion', label: 'Configuración', roles: ['admin'],
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const IPS_MENU_ITEMS_BASE = [
  { key: 'cargue_masivo', label: 'Cargue masivo', roles: ['ips_user'], configKey: 'cargue_masivo', defaultOff: true,
    icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 4h16M4 14h16M10 4v16M15 4v16' },
  { key: 'data', label: 'Gestión de data', roles: ['ips_user'],
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { key: 'verificar', label: 'Verificar afiliado', roles: ['ips_user'],
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { key: 'historias', label: 'Historias clínicas', roles: ['ips_user'], configKey: 'historias_pdf',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'reportes', label: 'Reportes pendientes', roles: ['ips_user'],
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { key: 'indicadores', label: 'Indicadores', roles: ['ips_user'],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

function getIpsMenuItems(systemConfig) {
  return IPS_MENU_ITEMS_BASE.filter((item) => {
    if (!item.configKey) return true
    if (item.defaultOff) return systemConfig[item.configKey] === true
    return systemConfig[item.configKey] !== false
  })
}

const META = {
  inicio: { title: 'Inicio', sub: 'Centro de operaciones' },
  subir: { title: 'Validar data', sub: 'Validar y cargar data' },
  formulario: { title: 'Cargue mensual', sub: 'Registro de gestante por formulario' },
  historial: { title: 'Verificar data', sub: 'Cargues de los prestadores' },
  consolidar: { title: 'Consolidar', sub: 'Une las datas' },
  historias: { title: 'Historias clínicas', sub: 'Expedientes clínicos' },
  reportes: { title: 'Reportes pendientes', sub: 'Procedimientos y medicamentos pendientes' },
  verificar: { title: 'Verificar afiliado', sub: 'Consulta de datos demograficos por documento' },
  prestadores: { title: 'Usuarios', sub: 'Prestadores y lideres de programa' },
  bucket: { title: 'Gestión de bucket', sub: 'Uso de almacenamiento por IPS' },
  data: { title: 'Gestión de data', sub: 'Ver y editar registros de gestantes' },
  indicadores: { title: 'Indicadores', sub: 'Métricas y estadísticas' },
  configuracion: { title: 'Configuración', sub: 'Gestión de accesos y módulos' },
  cargue_masivo: { title: 'Cargue masivo', sub: 'Subir archivos Excel, TXT o CSV' },
}
const ROLE_TITLE = { historial: { admin: 'Verificar data', lider: 'Verificar data', prestador: 'Mis cargues' } }

const SIDEBAR_W = 248

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 text-left rounded-xl transition-all"
      style={{
        backgroundColor: active ? 'var(--green-50)' : 'transparent',
        transitionDuration: '150ms',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={{
          backgroundColor: active ? 'var(--green-500)' : 'var(--bg-subtle)',
          color: active ? '#ffffff' : 'var(--text-muted)',
          boxShadow: active ? '0 3px 10px rgba(90,174,90,0.30)' : 'none',
          transitionDuration: '150ms',
        }}
      >
        <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? '2.1' : '1.7'}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
      </span>
      <span
        className="truncate text-[0.82rem]"
        style={{ fontWeight: active ? '600' : '500', color: active ? 'var(--green-700)' : 'var(--text-secondary)' }}
      >
        {item.label}
      </span>
    </button>
  )
}

const ICON_SUN = 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z'
const ICON_MOON = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'

function ThemeSwitch({ dark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all"
      style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', transitionDuration: '150ms' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span className="w-[17px] h-[17px] shrink-0 flex items-center justify-center">
        <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d={dark ? ICON_MOON : ICON_SUN} />
        </svg>
      </span>
      <span className="flex-1">Modo oscuro</span>
      <span className="relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors" style={{ backgroundColor: dark ? 'var(--green-500)' : 'var(--border-strong)' }}>
        <span className="inline-block h-[14px] w-[14px] rounded-full shadow" style={{ backgroundColor: '#fff', transform: dark ? 'translateX(16px)' : 'translateX(2px)', transition: 'transform 150ms var(--ease-out)' }} />
      </span>
    </button>
  )
}

// Modulos que siempre quedan reservados al administrador.
const ADMIN_ONLY_SECTIONS = ['prestadores', 'configuracion']

function filterItems(items, role, permissions) {
  return items.filter((i) => {
    if (!i.roles.includes(role)) return false
    // Los permisos configurables solo aplican a prestador y lider.
    if (!permissions || (role !== 'prestador' && role !== 'lider')) return true
    if (ADMIN_ONLY_SECTIONS.includes(i.key)) return true
    return permissions[i.key] !== false
  })
}

function NavList({ items, section, onNavigate, onSidebarClose }) {
  return (
    <div className="space-y-0.5">
      {items.map((item, idx) => (
        <NavItem
          key={item.key + idx}
          item={item}
          active={section === item.key}
          onClick={() => { onNavigate(item.key); onSidebarClose() }}
        />
      ))}
    </div>
  )
}

function NavSection({ label, items, role, section, onNavigate, onSidebarClose, permissions }) {
  const visible = filterItems(items, role, permissions)
  if (visible.length === 0) return null
  return (
    <div className="mt-3">
      <div className="px-2 pb-1.5">
        <span className="text-[0.56rem] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <NavList items={visible} section={section} onNavigate={onNavigate} onSidebarClose={onSidebarClose} />
    </div>
  )
}

function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (next.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres'); return }
    if (next !== repeat) { setError('Las contraseñas nuevas no coinciden'); return }
    setLoading(true)
    try {
      await changePassword(current, next)
      setDone(true)
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onMouseDown={() => { if (!loading) onClose() }}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="modal-title">Cambiar contraseña</div>
            <div className="modal-desc" style={{ marginBottom: 0 }}>Actualiza la clave de tu cuenta.</div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {done ? (
          <>
            <div className="rounded-lg p-3 mb-4 text-sm" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)' }}>
              Contraseña actualizada correctamente.
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary text-sm px-4 py-2">Entendido</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="block">
              <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña actual</span>
              <input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="w-full input"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={8}
                className="w-full input"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Repetir nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                required
                minLength={8}
                className="w-full input"
              />
            </label>

            {error && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(180,35,24,0.2)' }}>
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} disabled={loading} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm px-4 py-2">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}

export default function DashboardLayout({ section, onNavigate, children, templates = [], activeTemplate = null, onSelectTemplate, systemConfig = {}, onRefreshConfig }) {
  const { user, logout, permissions } = useAuth()
  // Se inicializa desde la clase que dejo el script pre-paint de index.html.
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  // En escritorio el menu arranca visible; en mobile, cerrado.
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  const [pwdOpen, setPwdOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('datas-theme', dark ? 'dark' : 'light') } catch (e) { /* storage no disponible */ }
  }, [dark])

  useEffect(() => {
    if (user?.role !== 'ips_user' || !onRefreshConfig) return
    const interval = setInterval(() => { onRefreshConfig() }, 30000)
    return () => clearInterval(interval)
  }, [user?.role, onRefreshConfig])

  const role = user?.role || 'prestador'
  const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'lider' ? 'Lider de Programa' : user?.role === 'ips_user' ? 'IPS' : 'Prestador'
  const meta = { ...(META[section] || META.inicio) }
  const rt = ROLE_TITLE[section]?.[role]
  if (rt) meta.title = rt

  const templateMeta = activeTemplate ? templates.find((t) => t.key === activeTemplate) : null
  const hasTemplate = Boolean(activeTemplate)
  const closeSidebar = () => setOpen(false)

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ width: SIDEBAR_W }}>

      {/* Usuario */}
      <div className="px-3 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.8rem] font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #2E7D32, #43A047)', color: '#fff' }}>
            {(user?.name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[0.82rem] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
            <div className="text-[0.63rem] font-medium truncate" style={{ color: 'var(--green-600)' }}>{roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">

        {role === 'ips_user' ? (
          <NavSection label="Menú" items={getIpsMenuItems(systemConfig)} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} permissions={permissions} />
        ) : (
          <>
            <NavList
              items={filterItems(MENU_ITEMS, role, permissions)}
              section={section}
              onNavigate={onNavigate}
              onSidebarClose={closeSidebar}
            />

            {/* Plantilla activa */}
            {hasTemplate && templateMeta && (
              <div className="mt-3">
                <div className="px-2 pb-1.5">
                  <span className="text-[0.56rem] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Plantilla activa</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--green-500)' }} />
                  <span className="truncate text-[0.78rem] font-medium" style={{ color: 'var(--text-primary)' }}>{templateMeta.label}</span>
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
            )}

            {hasTemplate && (
              <>
                <NavSection label="Operaciones" items={OPERACIONES_ITEMS} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} permissions={permissions} />
                <NavSection label="Gestión" items={GESTION_ITEMS} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} permissions={permissions} />
                <NavSection label="Administración" items={ADMIN_ITEMS} role={role} section={section} onNavigate={onNavigate} onSidebarClose={closeSidebar} permissions={permissions} />
              </>
            )}
          </>
        )}
      </nav>

      {/* Pie */}
      <div className="shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <ThemeSwitch dark={dark} onToggle={() => setDark((v) => !v)} />
        <button
          onClick={() => setPwdOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all"
          style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', transitionDuration: '150ms' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg className="w-[17px] h-[17px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <span>Cambiar contraseña</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all"
          style={{ fontSize: '0.8rem', color: 'var(--danger)', transitionDuration: '150ms' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg className="w-[17px] h-[17px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>Cerrar sesión</span>
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
          <span className="text-white font-semibold text-[0.85rem] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>DATAS PYM</span>
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
            borderRight: '1px solid var(--border-subtle)',
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
              Desarrollado por el Ing. Jose Quintero {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>

      {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} />}
    </div>
  )
}
