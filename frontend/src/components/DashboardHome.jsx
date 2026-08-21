import React from 'react'

const MODULE_ICONS = {
  gestante: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  citologia: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z',
  mamografia: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  penta: 'M12 3v18M5 12h14',
}

const MODULES_META = {
  gestante: { short: 'GEST', desc: 'Control prenatal y ruta materno perinatal' },
  citologia: { short: 'CITO', desc: 'Tamizaje de cáncer cervicouterino' },
  mamografia: { short: 'MAMO', desc: 'Tamizaje de cáncer de mama' },
  penta: { short: 'PENTA', desc: 'Vacunación pentavalente' },
}

export default function DashboardHome({ user, summary, batchResults, templates, activeTemplate, onNavigate }) {
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const now = new Date().toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const recientes = batchResults.slice(0, 5).map((item) => ({
    prestador: user?.name || '—',
    plantilla: (templates.find((t) => t.key === (item.templateKey || activeTemplate))?.label) || (item.templateKey || '—'),
    estado: (item.summary?.errors ?? 0) === 0 ? 'Validado' : 'Con errores',
    registros: item.summary?.total_rows ?? '—',
    fecha: 'Hoy ' + nowTime,
  }))

  return (
    <div className="space-y-8 fade-in">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-[1.375rem] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {saludo}, {firstName}
        </h1>
        <p className="mt-1 text-[0.875rem]" style={{ color: 'var(--text-tertiary)' }}>
          Gestiona la recepción y validación de datos de tus prestadores.
        </p>
        <p className="mt-0.5 text-[0.75rem] capitalize" style={{ color: 'var(--text-tertiary)' }}>
          Última actualización · Hoy, {nowTime}
        </p>
      </div>

      {/* ── Modules ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-[0.9375rem] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((t) => {
            const meta = MODULES_META[t.key]
            if (!meta) return null
            return (
              <button
                key={t.key}
                onClick={() => onNavigate && onNavigate('subir')}
                className="flex items-start gap-4 p-5 text-left rounded-lg transition-all group"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  transitionDuration: 'var(--duration)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-300)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-subtle)', color: 'var(--green-600)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={MODULE_ICONS[t.key] || MODULE_ICONS.gestante} /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[0.8125rem] font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                    <span className="text-[0.5625rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>{meta.short}</span>
                  </div>
                  <p className="text-[0.75rem] leading-snug mb-2" style={{ color: 'var(--text-tertiary)' }}>{meta.desc}</p>
                  <div className="flex items-center gap-3 text-[0.6875rem]" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{t.fields} variables</span>
                    <span style={{ color: 'var(--border-strong)' }}>·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green-400)' }} />
                      Disponible
                    </span>
                  </div>
                </div>
                <svg className="w-4 h-4 shrink-0 mt-1 transition-transform" style={{ color: 'var(--text-tertiary)', transitionDuration: 'var(--duration)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Activity ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-[0.9375rem] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Actividad reciente</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Prestador</th>
                <th>Módulo</th>
                <th>Registros</th>
                <th>Estado</th>
                <th className="text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.length > 0 ? recientes.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium">{r.prestador}</td>
                  <td>{r.plantilla}</td>
                  <td>{r.registros}</td>
                  <td>
                    <span className={r.estado === 'Validado' ? 'badge-success' : 'badge-error'}>{r.estado}</span>
                  </td>
                  <td className="text-right whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>{r.fecha}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="empty-icon">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="empty-title">Sin actividad reciente</div>
                      <div className="empty-desc">Los registros aparecerán aquí cuando los prestadores suban información.</div>
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
