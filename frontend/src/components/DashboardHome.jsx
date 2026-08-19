import React from 'react'
import { useAuth } from '../AuthContext'

function Stat({ label, value }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function RecentRow({ prestador, plantilla, estado, fecha }) {
  const badge = estado === 'Validado'
    ? 'badge-success'
    : estado === 'Pendiente' ? 'badge-warning' : 'badge-neutral'
  return (
    <tr>
      <td className="px-4 py-3">{prestador}</td>
      <td className="px-4 py-3">{plantilla}</td>
      <td className="px-4 py-3"><span className={badge}>{estado}</span></td>
      <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fecha}</td>
    </tr>
  )
}

export default function DashboardHome({ user, summary, batchResults, templates, activeTemplate, onSelectTemplate }) {
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const now = new Date().toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

  const recientes = batchResults.slice(0, 5).map((item) => ({
    prestador: user?.name || '—',
    plantilla: (templates.find((t) => t.key === (item.templateKey || activeTemplate))?.label) || (item.templateKey || '—'),
    estado: (item.summary?.errors ?? 0) === 0 ? 'Validado' : 'Con errores',
    fecha: 'Hoy',
  }))

  return (
    <div className="space-y-8 fade-in">
      {/* Saludo editorial */}
      <div>
        <div className="page-title">{saludo}, {firstName}</div>
        <div className="page-subtitle">Resumen de recepción de datos · Última actualización: {now}</div>
      </div>

      {/* Resumen en una sola línea (no tarjetas llenas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-6 border-y" style={{ borderColor: 'var(--border)' }}>
        <Stat label="Prestadores" value={isAdmin ? '—' : '1'} />
        <Stat label="Cargas pendientes" value={(summary?.errors ?? 0) > 0 ? String(summary.errors) : '0'} />
        <Stat label="Archivos procesados" value={batchResults.length || '—'} />
        <Stat label="Calidad" value={summary ? `${summary.quality_percent ?? 0}%` : '—'} />
      </div>

      {/* Actividad reciente en tabla */}
      <div>
        <div className="section-label mb-3">Actividad reciente</div>
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
                <RecentRow key={i} {...r} />
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isAdmin
                      ? 'Aún no hay actividad registrada en esta sesión.'
                      : 'Sube tu primera data mensual para comenzar.'}
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