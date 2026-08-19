import React from 'react'

const SHORT = { gestante: 'GEST', citologia: 'CITO', mamografia: 'MAMO', penta: 'PENTA' }
const ACCENTS = [
  { chip: 'bg-emerald-500', tag: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { chip: 'bg-rose-500', tag: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' },
  { chip: 'bg-amber-500', tag: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  { chip: 'bg-sky-500', tag: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' },
]

function Phoenix({ cls }) {
  return (
    <svg className={cls} viewBox="0 0 32 32" fill="none">
      <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.3" />
      <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.6" />
      <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
    </svg>
  )
}

function Stat({ label, value, icon, tint }) {
  const map = {
    green: { chip: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500' },
    red: { chip: 'bg-red-100 dark:bg-red-950/50 text-red-500', dot: 'bg-red-500' },
    amber: { chip: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    slate: { chip: 'bg-slate-100 dark:bg-[#22262C] text-slate-500 dark:text-slate-300', dot: 'bg-slate-400' },
  }
  const t = map[tint] || map.slate
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.65rem] font-bold text-[rgb(var(--faint))] uppercase tracking-wider">{label}</span>
        <span className={`chip w-8 h-8 rounded-lg ${t.chip}`}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-extrabold text-[rgb(var(--ink))] tracking-tight">{value}</span>
        <span className={`mb-1.5 w-1.5 h-1.5 rounded-full ${t.dot}`} />
      </div>
    </div>
  )
}

export default function DashboardHome({ user, summary, batchResults }) {
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const recent = batchResults.slice(0, 4)

  return (
    <div className="space-y-7 animate-fade-in-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123F20] via-[#175528] to-[#1E6B33] shadow-[0_20px_50px_rgba(18,63,32,0.35)]">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-emerald-200/10 blur-3xl" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block text-white/15">
          <span className="block w-40 h-40"><Phoenix cls="w-full h-full" /></span>
        </div>
        <div className="relative px-7 md:px-10 py-9 md:py-11">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20 text-[0.6rem] font-bold text-white/90 uppercase tracking-[0.15em]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {today}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20 text-[0.6rem] font-bold text-white/90 uppercase tracking-wider">
              {isAdmin ? 'EPS · Recepción de datos' : 'Prestador'}
            </span>
          </div>
          <h2 className="text-[clamp(1.7rem,4.5vw,2.6rem)] font-extrabold text-white tracking-tight leading-tight">Hola, {firstName} 👋</h2>
          <p className="text-white/75 text-sm mt-2 max-w-lg font-normal leading-relaxed">
            {isAdmin
              ? 'Recibe y verifica la data mensual de los prestadores, consolida la información y revisa las historias clínicas.'
              : 'Sube tu data mensual, descarga los formatos oficiales y gestiona tus historias clínicas.'}
          </p>
        </div>
      </section>

      {/* Estadísticas de la última validación */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Registros" value={summary.total} tint="slate"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <Stat label="Errores" value={summary.errors} tint="red"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <Stat label="Ajustes" value={summary.corrected} tint="amber"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} />
          <Stat label="Calidad" value={`${summary.quality_percent}%`} tint="green"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>
      )}

      {/* Últimos archivos procesados */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#2E9E4C] to-[#1E6B33]" />
            <h3 className="text-[15px] font-extrabold text-[rgb(var(--ink))] tracking-tight">Últimos archivos procesados</h3>
          </div>
          <div className="space-y-2">
            {recent.map((item) => (
              <div key={item.fileName} className="card px-4 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="chip w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#1E6B33] dark:text-emerald-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[rgb(var(--ink))] truncate">{item.fileName}</div>
                    <div className="text-xs text-[rgb(var(--faint))]">{item.summary?.total ?? 0} registros</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#1E6B33] dark:text-[#79CB8A] border border-emerald-200/70 dark:border-emerald-800/40 shrink-0">
                  {item.summary?.quality_percent ?? 0}% calidad
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}