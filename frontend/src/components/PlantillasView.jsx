import React from 'react'
import { DOWNLOAD_TEMPLATE_URL } from '../api'

const ACCENTS = [
  { chip: 'bg-emerald-500', dot: 'bg-emerald-500', tag: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { chip: 'bg-rose-500', dot: 'bg-rose-500', tag: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' },
  { chip: 'bg-amber-500', dot: 'bg-amber-500', tag: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  { chip: 'bg-sky-500', dot: 'bg-sky-500', tag: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' },
  { chip: 'bg-violet-500', dot: 'bg-violet-500', tag: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
]

const SHORT = { gestante: 'GEST', citologia: 'CITO', mamografia: 'MAMO', penta: 'PENTA' }

export default function PlantillasView({ templates, selectedTemplate, onSelect, onNavigate }) {
  const sel = templates.find((item) => item.key === selectedTemplate)
  const selIdx = Math.max(0, templates.findIndex((item) => item.key === selectedTemplate))
  const selAccent = ACCENTS[selIdx] || ACCENTS[0]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="section-header-bar" />
          <div>
            <h2 className="text-base font-extrabold text-[rgb(var(--ink))] tracking-tight">Formatos de data</h2>
            <p className="text-xs text-[rgb(var(--faint))] mt-0.5">Selecciona una plantilla, descárgala en Excel y sube tu data</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#047857] dark:text-[#6EE7B7] border border-emerald-200/70 dark:border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {templates.length} disponible{templates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Panel de la plantilla seleccionada */}
      {sel && (
        <section className="relative overflow-hidden rounded-[28px] bg-[#04120C] text-white shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -top-28 -right-24 w-80 h-80 rounded-full bg-emerald-500/30 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-sky-500/20 blur-[110px]" />
          <div className="relative flex flex-wrap items-center gap-5 px-6 md:px-8 py-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-sky-500/30 flex items-center justify-center text-white text-lg font-extrabold ring-1 ring-white/25 shadow-lg shrink-0">
              {String(selIdx + 1).padStart(2, '0')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 mb-1.5 ring-1 ring-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[0.55rem] font-bold text-white/90 tracking-[0.15em] uppercase">Plantilla seleccionada</span>
              </div>
              <h3 className="text-white text-xl font-extrabold tracking-tight">{sel.label}</h3>
              <p className="text-white/70 text-xs mt-1 max-w-xl">{sel.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">{sel.fields} variables</span>
                <span className="text-[0.55rem] font-bold tracking-wider rounded-md px-2 py-0.5 bg-white text-[#064E3B]">{SHORT[sel.key] || sel.key.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
              <a href={DOWNLOAD_TEMPLATE_URL(sel.key)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#04120C] hover:from-emerald-300 hover:to-emerald-400 px-5 py-3 text-sm font-extrabold shadow-2xl shadow-emerald-500/30 transition-all hover:scale-[1.03] active:scale-[0.97]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar en Excel
              </a>
              <button onClick={() => onNavigate('subir')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 text-white hover:bg-white/20 px-5 py-3 text-sm font-bold ring-1 ring-white/25 transition-all active:scale-95">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Subir data
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Tarjetas de plantillas */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((item, idx) => {
          const isSelected = selectedTemplate === item.key
          const num = String(idx + 1).padStart(2, '0')
          const accent = ACCENTS[idx] || ACCENTS[0]
          const short = SHORT[item.key] || item.key.toUpperCase()
          return (
            <div key={item.key} className={`relative transition-all duration-300 rounded-2xl bg-white dark:bg-[#1A1D21] border ${
              isSelected
                ? 'ring-2 ring-emerald-500/20 shadow-[0_10px_30px_rgba(30,107,51,0.12)] border-emerald-500/40 dark:border-emerald-600/50'
                : 'border-[var(--line)] dark:border-[#262B33] shadow-[0_1px_3px_rgba(15,23,42,0.05)] dark:shadow-black/30 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:hover:shadow-black/50 hover:-translate-y-1 hover:border-emerald-300/50 dark:hover:border-emerald-700/40'
            }`}>
              <button onClick={() => onSelect(item.key)} className="w-full text-left p-5">
                {isSelected && (
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full ${accent.dot} flex items-center justify-center shadow-sm`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all text-sm font-extrabold ${
                    isSelected ? `${accent.chip} text-white shadow-md` : 'bg-slate-100 dark:bg-[#22262C] text-[rgb(var(--ink))]'
                  }`}>
                    {num}
                  </div>
                  <div>
                    <span className="text-[0.55rem] font-bold text-[rgb(var(--faint))] tracking-[0.15em] uppercase block leading-none mb-1">Plantilla</span>
                    <span className="text-sm font-bold text-[rgb(var(--ink))]">{item.label}</span>
                  </div>
                </div>
                <p className="text-xs text-[rgb(var(--faint))] leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-[#1E6B33] dark:text-[#79CB8A] border border-emerald-200/70 dark:border-emerald-800/40">{item.fields} variables</span>
                  <span className={`text-[0.55rem] font-bold tracking-wider rounded-md px-2 py-0.5 ${accent.tag}`}>{short}</span>
                </div>
              </button>
              <div className="px-5 pb-4 pt-0 flex justify-end">
                <span className={`inline-flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-emerald-600 dark:text-emerald-300' : 'text-[rgb(var(--faint))]'}`}>
                  {isSelected ? 'Seleccionada' : 'Clic para seleccionar'}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-4 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs text-amber-900 dark:text-amber-200/80 leading-relaxed">
          <span className="font-bold">Importante:</span> los formatos respetan el instructivo oficial. Usa las listas desplegables y los formatos de fecha (AAAA-MM-DD).
        </div>
      </div>
    </div>
  )
}