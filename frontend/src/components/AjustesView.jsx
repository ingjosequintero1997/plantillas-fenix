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
    return <span className="badge-error">Sin corregir</span>
  }
  return <span className="badge-success">Ajustado</span>
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
      <div className="panel">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-medium">Ajustes realizados</span>
        </div>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>No hubo cambios: la data ya cumplía con el instructivo.</p>
      </div>
    )
  }

  return (
    <div className="panel space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Ajustes realizados</div>
        <span className="badge-neutral">{filtered.length} cambio{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ajuste..." className="input pl-9" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select sm:w-40">
          <option value="all">Todos</option>
          <option value="corrected">Ajustados</option>
          <option value="error">Sin corregir</option>
        </select>
      </div>

      {groups.length === 0 && (
        <div className="text-sm py-4 text-center" style={{ color: 'var(--text-secondary)' }}>Sin resultados para este filtro.</div>
      )}

      <div className="space-y-2">
        {groups.map(([name, items]) => {
          const errors = items.filter((l) => l.status === 'error').length
          const corrected = items.length - errors
          const isOpen = !!expanded[name]
          const sample = items.slice(0, 3)
          return (
            <div key={name} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => toggle(name)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                    style={{ color: errors > 0 ? 'var(--error)' : 'var(--primary)', backgroundColor: errors > 0 ? '#FBE9E9' : 'var(--primary-light)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{items.length} registro{items.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {errors > 0 && <StatusPill status="error" />}
                  {corrected > 0 && <StatusPill status="corrected" />}
                  <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t divide-y" style={{ borderColor: 'var(--border)' }}>
                  {sample.map((l, i) => (
                    <div key={`${l.row}-${i}`} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs font-medium w-12 shrink-0 pt-1" style={{ color: 'var(--text-secondary)' }}>Fila {l.row}</span>
                      <div className="flex-1 grid gap-1 sm:grid-cols-2">
                        <div className="min-w-0">
                          <div className="text-[0.6rem] font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>Original</div>
                          <div className="text-xs px-2.5 py-1.5 rounded-md break-words" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{String(l.original ?? '—') || '—'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[0.6rem] font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>Ajustado</div>
                          <div className="text-xs px-2.5 py-1.5 rounded-md break-words" style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>{String(l.corrected ?? '—') || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length > sample.length && (
                    <div className="px-4 py-2 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                      +{items.length - sample.length} más en esta variable...
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}