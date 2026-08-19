import React from 'react'

function Stat({ label, value, icon, tint }) {
  const map = {
    green: { chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
    red: { chip: 'bg-red-100 text-red-500 dark:bg-red-950/50', dot: 'bg-red-500', ring: 'ring-red-500/30' },
    amber: { chip: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
    slate: { chip: 'bg-slate-100 text-slate-500 dark:bg-[#1A222C] dark:text-slate-300', dot: 'bg-slate-400', ring: 'ring-slate-400/30' },
    sky: { chip: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300', dot: 'bg-sky-500', ring: 'ring-sky-500/30' },
  }
  const t = map[tint] || map.slate
  return (
    <div className={`card p-5 ring-1 ${t.ring} hover:scale-[1.02] transition-transform duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.65rem] font-bold text-[rgb(var(--faint))] uppercase tracking-wider">{label}</span>
        <span className={`chip w-8 h-8 rounded-lg ${t.chip}`}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[26px] font-extrabold text-[rgb(var(--ink))] tracking-tight">{value}</span>
        <span className={`mb-1.5 w-2 h-2 rounded-full ${t.dot} animate-pulse`} />
      </div>
    </div>
  )
}

function Phoenix({ cls }) {
  return (
    <svg className={cls} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="phx" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="url(#phx)" opacity="0.3" />
      <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="url(#phx)" opacity="0.6" />
      <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="url(#phx)" />
    </svg>
  )
}

export default function DashboardHome({ user, summary, batchResults }) {
  const isAdmin = user?.role === 'admin'
  const firstName = (user?.name || 'usuario').split(' ')[0]
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const recent = batchResults.slice(0, 4)

  return (
    <div className="space-y-7 animate-fade-in-up">
      {/* ═══ Hero principal ═══ */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#04120C] text-white shadow-[0_30px_70px_rgba(0,0,0,0.4)]">
        {/* Glows */}
        <div className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-emerald-500/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-sky-500/20 blur-[120px]" />
        {/* Phoenix decorativo */}
        <div className="pointer-events-none absolute right-6 bottom-0 hidden lg:block opacity-20 animate-float">
          <Phoenix cls="w-64 h-64" />
        </div>
        {/* Rejilla */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative px-7 md:px-10 py-9 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/20 backdrop-blur-sm text-[0.6rem] font-bold text-white/90 uppercase tracking-[0.15em]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {today}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500/30 to-sky-500/30 px-3.5 py-1.5 ring-1 ring-white/20 text-[0.6rem] font-bold text-white uppercase tracking-wider">
              {isAdmin ? 'EPS · Recepción de datos' : 'Prestador'}
            </span>
          </div>

          <h2 className="text-[clamp(1.9rem,5vw,3rem)] font-extrabold tracking-tight leading-[1.05]">
            Hola, <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-sky-300 bg-clip-text text-transparent">{firstName}</span>
          </h2>
          <p className="text-white/70 text-[15px] mt-3 max-w-lg font-normal leading-relaxed">
            {isAdmin
              ? 'Recibe y verifica la data mensual de los prestadores, consolida la información y revisa las historias clínicas.'
              : 'Sube tu data mensual, descarga los formatos oficiales y gestiona tus historias clínicas.'}
          </p>
        </div>
      </section>

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
          <div className="flex items-center gap-3 mb-4">
            <span className="section-header-bar" />
            <h3 className="text-[15px] font-extrabold text-[rgb(var(--ink))] tracking-tight">Últimos archivos procesados</h3>
          </div>
          <div className="space-y-2.5">
            {recent.map((item) => (
              <div key={item.fileName} className="card px-4 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="chip w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-sky-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[rgb(var(--ink))] truncate">{item.fileName}</div>
                    <div className="text-xs text-[rgb(var(--faint))]">{item.summary?.total ?? 0} registros</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#047857] dark:text-[#6EE7B7] border border-emerald-200/70 dark:border-emerald-800/40 shrink-0">
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