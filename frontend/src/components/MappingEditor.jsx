import React, { useMemo, useState } from 'react'

export default function MappingEditor({ mapping, templateNames, onChange }) {
  const [query, setQuery] = useState('')
  const entries = useMemo(() => {
    const sorted = Object.keys(mapping).sort((a, b) => a.localeCompare(b, 'es'))
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((item) => item.toLowerCase().includes(q) || String(mapping[item] || '').toLowerCase().includes(q))
  }, [mapping, query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar columna origen o destino"
          className="input pl-9"
        />
      </div>

      <div className="max-h-[420px] space-y-2 overflow-auto pr-1 scroll-thin">
      {entries.map((orig)=>(
        <div key={orig} className="animate-fade-in flex flex-col gap-2 rounded-xl border border-ink-line/60 dark:border-[#666669]/60 bg-white dark:bg-[#333337] p-3 md:flex-row md:items-center md:gap-3 hover:border-brand-300/50 dark:hover:border-brand-600/50 transition-colors">
          <div className="md:w-72 truncate text-sm font-semibold text-ink">{orig}</div>
          <select
            value={mapping[orig] || ''}
            onChange={(e)=> onChange(orig, e.target.value || null)}
            className="select md:flex-1"
          >
            <option value=''>-- sin map --</option>
            {templateNames.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
          <span className={`text-[0.5rem] font-semibold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
            mapping[orig]
              ? 'badge-green'
              : 'badge-gray'
          }`}>
            {mapping[orig] ? 'Asignado' : 'Vacío'}
          </span>
        </div>
      ))}
      </div>
    </div>
  )
}
