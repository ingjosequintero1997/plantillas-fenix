import React from 'react'

function Stat({ label, value, icon, tint }) {
  const map = {
    green: { chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    red: { chip: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
    amber: { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    slate: { chip: 'bg-slate-100 text-slate-600 dark:bg-[#1A222C] dark:text-slate-300' },
    sky: { chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
  }
  const t = map[tint] || map.slate
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.65rem] font-bold text-[rgb(var(--faint))] uppercase tracking-wider">{label}</span>
        <span className={`chip w-8 h-8 rounded-lg ${t.chip}`}>{icon}</span>
      </div>
      <div className="text-[26px] font-extrabold text-[rgb(var(--ink))] tracking-tight">{value}</div>
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
      {/* ═══ Encabezado simple ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold text-[rgb(var(--ink))] tracking-tight">
            Hola, <span className="text-[#2E7D32]">{firstName}</span>
          </h2>
          <p className="text-sm text-[rgb(var(--faint))] mt-1 capitalize">{today}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
          {isAdmin ? 'EPS · Recepción de datos' : 'Prestador'}
        </span>
      </div>

      {/* ═══ Estadísticas ═══ */}
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

      {/* ═══ Últimos archivos ═══ */}
      {recent.length > 0 && (
        <section>
          <h3 className="text-[15px] font-bold text-[rgb(var(--ink))] mb-3">Últimos archivos procesados</h3>
          <div className="space-y-2">
            {recent.map((item) => (
              <div key={item.fileName} className="card px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="chip w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[rgb(var(--ink))] truncate">{item.fileName}</div>
                    <div className="text-xs text-[rgb(var(--faint))]">{item.summary?.total ?? 0} registros</div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-emerald-300 shrink-0">
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