import React, { useState } from 'react'
import { useAuth } from '../AuthContext'

const MODULES = [
  { key: 'gestante', label: 'Gestante', desc: 'Control prenatal y ruta materno perinatal', short: 'GEST', color: '#15803D' },
  { key: 'citologia', label: 'Citología', desc: 'Tamizaje de cáncer cervicouterino', short: 'CITO', color: '#15803D' },
  { key: 'mamografia', label: 'Mamografía', desc: 'Tamizaje de cáncer de mama', short: 'MAMO', color: '#15803D' },
  { key: 'penta', label: 'Penta', desc: 'Vacunación pentavalente', short: 'PENTA', color: '#15803D' },
]

const MODULE_ICONS = {
  gestante: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  citologia: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
    </svg>
  ),
  mama: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  vacuna: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 12h14" />
    </svg>
  ),
}

const MODULE_ICON_KEY = { gestante: 'gestante', citologia: 'citologia', mamografia: 'mama', penta: 'vacuna' }

export default function TemplateSelector({ templates, onSelect }) {
  const { user } = useAuth()
  const [hovered, setHovered] = useState(null)
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const available = MODULES.filter((m) => templates.some((t) => t.key === m.key))

  if (templates.length === 0) {
    return (
      <div className="fade-in">
        <div className="mb-8">
          <h1 className="page-title">{saludo}, {firstName}</h1>
          <p className="page-subtitle mt-1">Cargando módulos de datos...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="page-title">{saludo}, {firstName}</h1>
        <p className="page-subtitle mt-1">Selecciona el módulo de datos con el que vas a trabajar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {available.map((m) => {
          const t = templates.find((x) => x.key === m.key)
          const isHovered = hovered === m.key
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              onMouseEnter={() => setHovered(m.key)}
              onMouseLeave={() => setHovered(null)}
              className="group flex flex-col text-left rounded-lg transition-all duration-150"
              style={{
                padding: 'var(--space-5)',
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${isHovered ? 'var(--green-300)' : 'var(--border-subtle)'}`,
                boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                transform: isHovered ? 'translateY(-1px)' : 'none',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    color: 'var(--green-600)',
                    backgroundColor: 'var(--surface-brand-weak)',
                  }}>
                  {MODULE_ICONS[MODULE_ICON_KEY[m.key]]}
                </div>
                <span style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--weight-semibold)',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--green-700)',
                  backgroundColor: 'var(--green-50)',
                }}>
                  {m.short}
                </span>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-title)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}>
                {m.label}
              </h3>
              <p style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-snug)',
                marginBottom: 'var(--space-3)',
              }}>
                {m.desc}
              </p>
              {t && (
                <p style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-muted)',
                }}>
                  {t.fields} variables
                </p>
              )}

              <div className="mt-auto pt-3 flex items-center gap-1"
                style={{
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--green-600)',
                }}>
                Entrar
                <svg className="w-3.5 h-3.5 transition-transform duration-150" style={{ transform: isHovered ? 'translateX(2px)' : 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
