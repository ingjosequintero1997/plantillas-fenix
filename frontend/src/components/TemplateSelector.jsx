import React from 'react'
import { useAuth } from '../AuthContext'

const MODULES = [
  { key: 'gestante', label: 'Gestante', desc: 'Control prenatal y ruta materno perinatal', short: 'GEST', icon: 'mujer' },
  { key: 'citologia', label: 'Citología', desc: 'Tamizaje de cáncer cervicouterino', short: 'CITO', icon: 'citologia' },
  { key: 'mamografia', label: 'Mamografía', desc: 'Tamizaje de cáncer de mama', short: 'MAMO', icon: 'mama' },
  { key: 'penta', label: 'Penta', desc: 'Vacunación pentavalente', short: 'PENTA', icon: 'vacuna' },
]

function Icon({ name }) {
  const common = { className: 'w-8 h-8', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: '1.5' }
  const paths = {
    mujer: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    citologia: <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />,
    mama: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
    vacuna: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 12h14" />,
  }
  return <svg {...common}>{paths[name]}</svg>
}

export default function TemplateSelector({ templates, onSelect }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const available = MODULES.filter((m) => templates.some((t) => t.key === m.key))

  if (templates.length === 0) {
    return (
      <div className="fade-in">
        <div className="mb-8">
          <div className="page-title" style={{ fontSize: '1.5rem' }}>{saludo}, {firstName}</div>
          <div className="page-subtitle mt-1">Cargando módulos de datos...</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: '150px' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="page-title" style={{ fontSize: '1.5rem' }}>{saludo}, {firstName}</div>
        <div className="page-subtitle mt-1">Selecciona el módulo de datos con el que vas a trabajar.</div>
      </div>

      {/* Módulos compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {available.map((m) => {
          const t = templates.find((x) => x.key === m.key)
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              className="group flex flex-col p-5 text-left rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(105,196,85,0.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                  <Icon name={m.icon} />
                </div>
                <span className="text-[0.6rem] font-semibold tracking-[0.1em] px-2 py-0.5 rounded"
                  style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                  {m.short}
                </span>
              </div>
              <div className="text-base font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Manrope, sans-serif' }}>
                {m.label}
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{m.desc}</div>
              {t && (
                <div className="text-[0.68rem]" style={{ color: 'var(--text-secondary)' }}>{t.fields} variables</div>
              )}
              <div className="mt-2 flex items-center gap-1 text-[0.8rem] font-medium"
                style={{ color: 'var(--primary)' }}>
                Entrar
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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