import React from 'react'
import { useAuth } from '../AuthContext'

const ACCENTS = [
  { icon: 'mujer' },
  { icon: 'citologia' },
  { icon: 'mama' },
  { icon: 'vacuna' },
]

function Icon({ name }) {
  const common = { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: '1.6' }
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

  return (
    <div className="max-w-2xl fade-in">
      <div className="mb-8">
        <div className="page-title">{saludo}, {firstName}</div>
        <div className="page-subtitle">Selecciona la plantilla con la que vas a trabajar.</div>
      </div>

      <div className="space-y-2">
        {templates.map((item, idx) => {
          const accent = ACCENTS[idx] || ACCENTS[0]
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left rounded-lg transition-colors hover:bg-white"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                <Icon name={accent.icon} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium" style={{ color: 'var(--text)' }}>{item.label}</span>
                <span className="block text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
              </span>
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{item.fields} variables</span>
              <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}