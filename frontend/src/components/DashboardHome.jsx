import React from 'react'

const STAT_ICONS = {
  'Prestadores': <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />,
  'Cargas pendientes': <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  'Archivos procesados': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  'Calidad': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
}

const QUICK_ACTIONS = [
  { label: 'Validar data', desc: 'Subir plantilla Excel', key: 'subir', roles: ['admin', 'prestador'], icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { label: 'Verificar', desc: 'Revisar cargues', key: 'historial', roles: ['admin', 'lider'], icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Consolidar', desc: 'Unir datas', key: 'consolidar', roles: ['admin', 'lider'], icon: 'M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z' },
  { label: 'Historias', desc: 'Expedientes PDF', key: 'historias', roles: ['admin', 'prestador', 'lider'], icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

function Stat({ label, value, icon, isCritical }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 20px 16px',
      border: '1px solid var(--border-subtle)',
      boxShadow: '0 1px 3px rgba(28,28,26,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: isCritical ? 'linear-gradient(90deg, #D17D59, #E0A184)' : 'linear-gradient(90deg, var(--green-500), var(--green-300))',
      }} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
          color: isCritical ? 'var(--accent-500)' : 'var(--green-600)',
          backgroundColor: isCritical ? 'var(--accent-50)' : 'var(--green-50)',
        }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{icon}</svg>
        </div>
      </div>
    </div>
  )
}

export default function DashboardHome({ user, summary, batchResults, templates, activeTemplate, onNavigate }) {
  const isAdmin = user?.role === 'admin'
  const role = user?.role === 'admin' ? 'admin' : user?.role === 'lider' ? 'lider' : 'prestador'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const now = new Date().toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const hasErrors = (summary?.errors ?? 0) > 0
  const quickActions = QUICK_ACTIONS.filter((a) => a.roles.includes(role))

  const recientes = batchResults.slice(0, 5).map((item) => ({
    prestador: user?.name || '—',
    plantilla: (templates.find((t) => t.key === (item.templateKey || activeTemplate))?.label) || (item.templateKey || '—'),
    estado: (item.summary?.errors ?? 0) === 0 ? 'Validado' : 'Con errores',
    fecha: 'Hoy',
  }))

  return (
    <div className="space-y-6 fade-in">
      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl" style={{
        background: 'linear-gradient(145deg, #3A863A 0%, #5AAE5A 35%, #6BC06B 70%, #8AD998 100%)',
        boxShadow: '0 8px 32px rgba(90,174,90,0.30), 0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <svg className="absolute -bottom-16 -right-16 w-[320px] h-[320px] opacity-[0.06]" viewBox="0 0 32 32" fill="none">
          <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="#fff" />
          <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="#fff" />
        </svg>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(244,231,43,0.12)' }} />

        <div className="relative p-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-title-lg)', fontWeight: '700',
              color: '#fff', letterSpacing: '-0.02em', lineHeight: '1.2',
            }}>
              {saludo}, {firstName}
            </h1>
            <p className="capitalize mt-1.5" style={{ fontSize: 'var(--text-body)', color: 'rgba(255,255,255,0.7)' }}>
              {now}
            </p>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: '600', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sistema</div>
              <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600', color: '#fff' }}>Operativo</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Prestadores" value={isAdmin ? '—' : '1'} icon={STAT_ICONS['Prestadores']} />
        <Stat label="Cargas pendientes" value={hasErrors ? String(summary.errors) : '0'} icon={STAT_ICONS['Cargas pendientes']} isCritical={hasErrors} />
        <Stat label="Archivos procesados" value={batchResults.length || '—'} icon={STAT_ICONS['Archivos procesados']} />
        <Stat label="Calidad" value={summary ? `${summary.quality_percent ?? 0}%` : '—'} icon={STAT_ICONS['Calidad']} />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      {quickActions.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-title)', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={() => onNavigate && onNavigate(action.key)}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 1px 3px rgba(28,28,26,0.04)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-300)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(90,174,90,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(28,28,26,0.04)'; e.currentTarget.style.transform = 'none' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-600)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={action.icon} /></svg>
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)' }}>{action.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '1px' }}>{action.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Actividad reciente ─────────────────────────────────── */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 1px 3px rgba(28,28,26,0.06)',
        overflow: 'hidden',
      }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-title)', fontWeight: '600', color: 'var(--text-primary)' }}>Actividad reciente</h2>
          <span className="badge-success" style={{ fontSize: '0.6rem' }}>Esta sesión</span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Prestador</th>
                <th>Plantilla</th>
                <th>Estado</th>
                <th className="text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.length > 0 ? recientes.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'var(--weight-medium)' }}>{r.prestador}</td>
                  <td>{r.plantilla}</td>
                  <td>
                    <span className={r.estado === 'Validado' ? 'badge-success' : 'badge-error'}>{r.estado}</span>
                  </td>
                  <td className="text-right whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{r.fecha}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4}>
                    <div className="empty" style={{ padding: 'var(--space-10)' }}>
                      <div className="empty-icon">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="empty-title">Sin actividad esta sesión</div>
                      <div className="empty-desc">
                        {isAdmin
                          ? 'Aún no hay cargues registrados. Los datos aparecerán aquí cuando los prestadores suban información.'
                          : 'Sube tu primera data para comenzar. La encontrarás resumida aquí.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
