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
    <div className="card" style={{ borderTop: `2px solid ${borderColor}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ color: iconColor, backgroundColor: iconBg }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{icon}</svg>
        </span>
      </div>
      <div className="stat-value">{value}</div>
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
      <div className="panel" style={{
        background: 'linear-gradient(135deg, #0D973C 0%, #0A7A32 100%)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(13,151,60,0.25)',
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-title-lg)',
              fontWeight: 'var(--weight-bold)',
              color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              {saludo}, {firstName}
            </h1>
            <p className="capitalize" style={{ fontSize: 'var(--text-body)', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
              {now}
            </p>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 'var(--weight-semibold)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sistema</div>
              <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 'var(--weight-semibold)', color: '#fff' }}>Operativo</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Prestadores" value={isAdmin ? '—' : '1'} icon={STAT_ICONS['Prestadores']} />
        <Stat label="Cargas pendientes" value={hasErrors ? String(summary.errors) : '0'} icon={STAT_ICONS['Cargas pendientes']} isCritical={hasErrors} />
        <Stat label="Archivos procesados" value={batchResults.length || '—'} icon={STAT_ICONS['Archivos procesados']} />
        <Stat label="Calidad" value={summary ? `${summary.quality_percent ?? 0}%` : '—'} icon={STAT_ICONS['Calidad']} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-title)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Actividad reciente</h2>
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
                    <div className="empty" style={{ padding: 'var(--space-8)' }}>
                      <div className="empty-icon">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
