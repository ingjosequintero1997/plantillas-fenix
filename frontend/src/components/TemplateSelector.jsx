import React from 'react'
import { useAuth } from '../AuthContext'

const ACCENTS = [
  { chip: 'bg-[#5EBA65]', icon: '👶', desc: 'Data de control prenatal y gestantes', short: 'GEST' },
  { chip: 'bg-rose-500', icon: '🔬', desc: 'Data de citologías y tamizaje', short: 'CITO' },
  { chip: 'bg-sky-500', icon: '🩺', desc: 'Data de mamografías de tamizaje', short: 'MAMO' },
  { chip: 'bg-amber-500', icon: '💉', desc: 'Data de vacunación penta', short: 'PENTA' },
]

export default function TemplateSelector({ templates, onSelect }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Encabezado */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#5EBA65]/15 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-[#6FCB76] border border-[#5EBA65]/40 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#5EBA65] animate-pulse" />
          {isAdmin ? 'EPS · Recepción de datos' : 'Prestador'}
        </div>
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold text-[rgb(var(--ink))] tracking-tight">
          Hola, <span className="text-[#2E7D32]">{firstName}</span>
        </h2>
        <p className="text-[15px] text-[rgb(var(--faint))] mt-2">
          Selecciona el módulo de plantilla con el que vas a trabajar. Cada módulo es independiente: su propio cargue, historias clínicas y consolidación.
        </p>
      </div>

      {/* Tarjetas de plantillas */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((item, idx) => {
          const accent = ACCENTS[idx] || ACCENTS[0]
          const num = String(idx + 1).padStart(2, '0')
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="group relative text-left overflow-hidden rounded-3xl bg-white dark:bg-[#131920] border border-[#5EBA65]/25 dark:border-[#5EBA65]/20 shadow-[0_2px_10px_rgba(15,23,42,0.05)] dark:shadow-black/30 hover:shadow-[0_20px_50px_rgba(94,186,101,0.20)] dark:hover:shadow-black/60 hover:-translate-y-1.5 hover:border-[#5EBA65]/50 transition-all duration-300 p-6"
            >
              {/* Top bar */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#5EBA65] to-[#388E3C]" />

              <div className="flex items-center justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${accent.chip} shadow-lg shadow-black/10`}>
                  {accent.icon}
                </div>
                <span className="text-[2.5rem] font-extrabold text-[rgb(var(--ink))]/5 leading-none">{num}</span>
              </div>

              <div className="text-[0.6rem] font-bold text-[rgb(var(--faint))] uppercase tracking-[0.15em] mb-1">Módulo de plantilla</div>
              <h3 className="text-lg font-extrabold text-[rgb(var(--ink))] tracking-tight mb-1.5">{item.label}</h3>
              <p className="text-[13px] text-[rgb(var(--faint))] leading-relaxed mb-5">{accent.desc}</p>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#5EBA65]/15 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-[#6FCB76] border border-[#5EBA65]/40">
                  {item.fields} variables
                </span>
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-[#2E7D32] dark:text-[#6FCB76] uppercase tracking-wider group-hover:gap-2 transition-all">
                  Entrar <span>→</span>
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}