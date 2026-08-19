import React from 'react'
import { useAuth } from '../AuthContext'

const ACCENTS = [
  { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: 'mujer' },
  { chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', icon: 'citologia' },
  { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', icon: 'mama' },
  { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: 'vacuna' },
]

function Icon({ name }) {
  const common = { className: 'w-6 h-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: '1.8' }
  const paths = {
    mujer: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    citologia: <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />,
    mama: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
    vacuna: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m7.5 0V5.5m0 13V19M12 3.5A8.5 8.5 0 0112 20.5 8.5 8.5 0 0112 3.5z" />,
  }
  return <svg {...common}>{paths[name]}</svg>
}

export default function TemplateSelector({ templates, onSelect }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Encabezado */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 mb-5">
          {isAdmin ? 'EPS · Recepción de datos' : 'Prestador'}
        </div>
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold text-[rgb(var(--ink))] tracking-tight">
          Hola, <span className="text-[#2E7D32]">{firstName}</span>
        </h2>
        <p className="text-[15px] text-[rgb(var(--faint))] mt-2">
          Selecciona la plantilla con la que vas a trabajar. Cada una es independiente: su propio cargue, historias clínicas y consolidación.
        </p>
      </div>

      {/* Tarjetas de plantillas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((item, idx) => {
          const accent = ACCENTS[idx] || ACCENTS[0]
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="group text-left rounded-2xl bg-white dark:bg-[#131920] border border-slate-200 dark:border-[#1E2733] p-5 hover:border-[#5EBA65]/50 hover:shadow-md dark:hover:shadow-black/40 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent.chip}`}>
                <Icon name={accent.icon} />
              </div>
              <div className="text-[0.6rem] font-bold text-[rgb(var(--faint))] uppercase tracking-wider mb-1">Plantilla</div>
              <h3 className="text-base font-bold text-[rgb(var(--ink))] tracking-tight mb-1.5">{item.label}</h3>
              <p className="text-[13px] text-[rgb(var(--faint))] leading-relaxed mb-4">{item.description}</p>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#1E2733] pt-3">
                <span className="text-[0.55rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">{item.fields} variables</span>
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-[#2E7D32] dark:text-emerald-300 uppercase tracking-wider">
                  Entrar <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}