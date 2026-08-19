import React, { useMemo, useState } from 'react'

function groupLogs(logs) {
  const groups = {}
  logs.forEach((l) => {
    if (!groups[l.column]) groups[l.column] = []
    groups[l.column].push(l)
  })
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
}

function StatusPill({ status }) {
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[0.45rem] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-700/40">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Sin corregir
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[0.45rem] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 border border-brand-200/50 dark:border-brand-700/40">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      Ajustado
    </span>
  )
}

export default function AjustesView({ logs }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((l) => {
      const okStatus = status === 'all' ? true : l.status === status
      if (!okStatus) return false
      if (!q) return true
      return `${l.row} ${l.column} ${l.original ?? ''} ${l.corrected ?? ''}`.toLowerCase().includes(q)
    })
  }, [logs, query, status])

  const groups = useMemo(() => groupLogs(filtered), [filtered])

  const toggle = (name) => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))

  if (logs.length === 0) {
    return (
      <section className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-brand-700 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">Ajustes realizados</h2>
            <p className="text-xs text-ink-muted/70">No hubo cambios: la data ya cumplía con el instructivo.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0 shadow-md shadow-amber-900/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">Ajustes realizados</h2>
            <p className="text-xs text-ink-muted/70">Cambios aplicados a la data para cumplir el instructivo</p>
          </div>
        </div>
        <span className="badge-gray">{filtered.length} cambio{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-[#F8F7F4] dark:bg-[#28282B] p-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ajuste…" className="input pl-9" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select md:w-44">
          <option value="all">Todos</option>
          <option value="corrected">Ajustados</option>
          <option value="error">Sin corregir</option>
        </select>
      </div>

      {groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-line/70 dark:border-[#555558] p-6 text-center text-sm text-ink-muted">
          Sin resultados para este filtro.
        </div>
      )}

      <div className="space-y-2">
        {groups.map(([name, items]) => {
          const errors = items.filter((l) => l.status === 'error').length
          const corrected = items.length - errors
          const isOpen = !!expanded[name]
          const sample = items.slice(0, 3)
          return (
            <div key={name} className="rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-white dark:bg-[#333337] overflow-hidden">
              <button onClick={() => toggle(name)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F8F7F4] dark:hover:bg-[#28282B] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${errors > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
                    <svg className={`w-4 h-4 ${errors > 0 ? 'text-red-500' : 'text-brand-700 dark:text-brand-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink truncate">{name}</div>
                    <div className="text-[0.55rem] text-ink-muted">{items.length} registro{items.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {errors > 0 && <StatusPill status="error" />}
                  {corrected > 0 && <StatusPill status="corrected" />}
                  <svg className={`w-4 h-4 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-ink-line/40 dark:border-[#666669]/40 divide-y divide-ink-line/40 dark:divide-[#666669]/40">
                  {sample.map((l, i) => (
                    <div key={`${l.row}-${i}`} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-[0.55rem] font-bold text-ink-faint uppercase tracking-wider pt-1 shrink-0 w-10">Fila {l.row}</span>
                      <div className="flex-1 grid gap-1 sm:grid-cols-2">
                        <div className="min-w-0">
                          <div className="text-[0.45rem] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Original</div>
                          <div className="text-xs text-ink-muted bg-red-50/60 dark:bg-red-950/30 rounded-lg px-2.5 py-1.5 border border-red-200/40 dark:border-red-800/40 break-words">{String(l.original ?? '—') || '—'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[0.45rem] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Ajustado</div>
                          <div className="text-xs text-ink bg-brand-50/60 dark:bg-brand-900/30 rounded-lg px-2.5 py-1.5 border border-brand-200/40 dark:border-brand-700/40 break-words">{String(l.corrected ?? '—') || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length > sample.length && (
                    <div className="px-4 py-2 text-[0.55rem] text-ink-muted text-center">
                      +{items.length - sample.length} más en esta variable…
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
