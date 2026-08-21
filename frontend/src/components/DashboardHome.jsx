import React from 'react'

const STAT_ICONS = {
  'Prestadores': <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />,
  'Cargas pendientes': <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  'Archivos procesados': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  'Calidad': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
}

function Stat({ label, value, icon, isCritical = false }) {
  const borderColor = isCritical ? 'var(--accent-400)' : 'var(--green-500)'
  const iconBg = isCritical ? 'var(--accent-50)' : 'var(--surface-brand-weak)'
  const iconColor = isCritical ? 'var(--accent-500)' : 'var(--green-600)'

  return (
    <div className="card group" style={{ borderTop: `2.5px solid ${borderColor}`, transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="flex items-start justify-between mb-4">
        <span className="section-label">{label}</span>
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ color: iconColor, backgroundColor: iconBg, boxShadow: `0 2px 8px ${isCritical ? 'rgba(209,125,89,0.12)' : 'rgba(90,174,90,0.12)'}` }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{icon}</svg>
        </span>
      </div>
      <div className="stat-value" style={{ fontSize: '1.75rem' }}>{value}</div>
    </div>
  )
}

export default function DashboardHome({ user, summary, batchResults, templates, activeTemplate }) {
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const now = new Date().toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const hasErrors = (summary?.errors ?? 0) > 0

  const recientes = batchResults.slice(0, 5).map((item) => ({
    prestador: user?.name || '—',
    plantilla: (templates.find((t) => t.key === (item.templateKey || activeTemplate))?.label) || (item.templateKey || '—'),
    estado: (item.summary?.errors ?? 0) === 0 ? 'Validado' : 'Con errores',
    fecha: 'Hoy',
  }))

  return (
    <div className="space-y-6 fade-in">
      {/* ── Saludo principal ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl" style={{
        background: 'linear-gradient(145deg, #3A863A 0%, #5AAE5A 35%, #6BC06B 70%, #8AD998 100%)',
        boxShadow: '0 8px 32px rgba(90,174,90,0.30), 0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Watermark decorativo */}
        <svg className="absolute -bottom-16 -right-16 w-[320px] h-[320px] opacity-[0.06]" viewBox="0 0 32 32" fill="none">
          <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="#fff" />
          <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="#fff" />
        </svg>
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(244,231,43,0.12)' }} />

        <div className="relative p-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-title-lg)',
              fontWeight: '700',
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
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

      {/* ── Actividad reciente ─────────────────────────────────── */}
      <div className="card" style={{ boxShadow: '0 4px 16px rgba(28,28,26,0.06), 0 1px 4px rgba(90,174,90,0.04)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-title)', fontWeight: '600', color: 'var(--text-primary)' }}>Actividad reciente</h2>
          <span className="badge-success" style={{ fontSize: '0.6rem' }}>Esta sesión</span>
        </div>
        <div className="table-wrap">
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
