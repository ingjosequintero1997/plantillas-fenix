import React from 'react'

const STAT_ICONS = {
  'Prestadores': <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />,
  'Cargas pendientes': <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  'Archivos procesados': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  'Calidad': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
}

function Stat({ label, value, icon, accent = '#0D973C' }) {
  return (
    <div className="card" style={{ borderTop: '3px solid var(--primary)', borderRadius: '0.75rem' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ color: accent, backgroundColor: 'var(--primary-light)' }}>
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">{icon}</svg>
        </span>
      </div>
      <div className="text-[1.7rem] font-bold" style={{ color: 'var(--text)', fontFamily: 'Manrope, sans-serif' }}>{value}</div>
    </div>
  )
}

export default function DashboardHome({ user, summary, batchResults, templates, activeTemplate }) {
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const now = new Date().toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  const recientes = batchResults.slice(0, 5).map((item) => ({
    prestador: user?.name || '—',
    plantilla: (templates.find((t) => t.key === (item.templateKey || activeTemplate))?.label) || (item.templateKey || '—'),
    estado: (item.summary?.errors ?? 0) === 0 ? 'Validado' : 'Con errores',
    fecha: 'Hoy',
  }))

  return (
    <div className="space-y-8 fade-in">
      {/* Saludo editorial */}
      <div className="panel" style={{ background: 'linear-gradient(135deg, #0D973C 0%, #60C050 100%)', border: 'none' }}>
        <div className="text-white font-bold text-[1.5rem] font-[Manrope] tracking-tight">
          {saludo}, {firstName}
        </div>
        <div className="text-white/80 text-sm mt-1 capitalize">{now}</div>
      </div>

      {/* Resumen en tarjetas sutiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Prestadores" value={isAdmin ? '—' : '1'} icon={STAT_ICONS['Prestadores']} />
        <Stat label="Cargas pendientes" value={(summary?.errors ?? 0) > 0 ? String(summary.errors) : '0'} icon={STAT_ICONS['Cargas pendientes']} accent={summary?.errors ? '#C94B4B' : '#0D973C'} />
        <Stat label="Archivos procesados" value={batchResults.length || '—'} icon={STAT_ICONS['Archivos procesados']} />
        <Stat label="Calidad" value={summary ? `${summary.quality_percent ?? 0}%` : '—'} icon={STAT_ICONS['Calidad']} />
      </div>

      {/* Actividad reciente en tabla */}
      <div>
        <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Actividad reciente</div>
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
                  <td>{r.prestador}</td>
                  <td>{r.plantilla}</td>
                  <td>
                    <span className={r.estado === 'Validado' ? 'badge-success' : 'badge-error'}>{r.estado}</span>
                  </td>
                  <td className="text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{r.fecha}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isAdmin
                      ? 'Aún no hay actividad registrada en esta sesión.'
                      : 'Sube tu primera data para comenzar.'}
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