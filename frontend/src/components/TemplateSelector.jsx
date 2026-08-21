import React, { useState } from 'react'
import { useAuth } from '../AuthContext'

const MODULES = [
  { key: 'gestante', label: 'Gestante', desc: 'Control prenatal y ruta materno perinatal', short: 'GEST' },
  { key: 'citologia', label: 'Citología', desc: 'Tamizaje de cáncer cervicouterino', short: 'CITO' },
  { key: 'mamografia', label: 'Mamografía', desc: 'Tamizaje de cáncer de mama', short: 'MAMO' },
  { key: 'penta', label: 'Penta', desc: 'Vacunación pentavalente', short: 'PENTA' },
]

const MODULE_ICONS = {
  gestante: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  citologia: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z',
  mamografia: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  penta: 'M12 3v18M5 12h14',
}

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
          <h1 className="text-[1.375rem] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{saludo}, {firstName}</h1>
          <p className="mt-1 text-[0.875rem]" style={{ color: 'var(--text-tertiary)' }}>Cargando módulos de datos...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-[1.375rem] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{saludo}, {firstName}</h1>
        <p className="mt-1 text-[0.875rem]" style={{ color: 'var(--text-tertiary)' }}>Selecciona el módulo de datos con el que vas a trabajar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {available.map((m) => {
          const t = templates.find((x) => x.key === m.key)
          const isHovered = hovered === m.key
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              onMouseEnter={() => setHovered(m.key)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-start gap-4 p-5 text-left rounded-lg transition-all group"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${isHovered ? 'var(--green-300)' : 'var(--border-default)'}`,
                boxShadow: isHovered ? 'var(--shadow-sm)' : 'none',
                transitionDuration: 'var(--duration)',
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-subtle)', color: 'var(--green-600)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={MODULE_ICONS[m.key]} /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[0.8125rem] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
                  <span className="text-[0.5625rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>{m.short}</span>
                </div>
                <p className="text-[0.75rem] leading-snug mb-2" style={{ color: 'var(--text-tertiary)' }}>{m.desc}</p>
                <div className="flex items-center gap-3 text-[0.6875rem]" style={{ color: 'var(--text-tertiary)' }}>
                  {t && <span>{t.fields} variables</span>}
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green-400)' }} />
                    Disponible
                  </span>
                </div>
              </div>
              <svg className="w-4 h-4 shrink-0 mt-1 transition-transform" style={{ color: 'var(--text-tertiary)', transform: isHovered ? 'translateX(2px)' : 'none', transitionDuration: 'var(--duration)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
