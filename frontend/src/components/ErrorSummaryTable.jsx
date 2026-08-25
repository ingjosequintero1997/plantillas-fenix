import React, { useMemo, useState } from 'react'

const PER_PAGE = 8

// Recorta fechas con hora (AAAA-MM-DD HH:MM:SS) a solo la fecha.
function mostrarValor(v) {
  const s = String(v ?? '').trim()
  if (!s) return '\u2014'
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/)
  return m ? m[1] : s
}

// Extrae las opciones validas de un mensaje "Debe ser uno de: X, Y, Z".
function extraerOpciones(s) {
  if (!s.startsWith('Debe ser uno de:')) return null
  return s.replace('Debe ser uno de:', '').split(',').map((o) => o.trim()).filter(Boolean)
}

function Correccion({ value }) {
  const s = String(value ?? '').trim()
  const opciones = extraerOpciones(s)
  if (opciones) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {opciones.map((op, i) => (
          <span
            key={i}
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0' }}
          >
            {op}
          </span>
        ))}
      </div>
    )
  }
  if (s) {
    return <span className="text-sm" style={{ color: '#166534' }}>{s}</span>
  }
  return <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Revisa el valor</span>
}

export default function ErrorSummaryTable({ logs }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState('count')
  const [sortDir, setSortDir] = useState('desc')

  const errors = useMemo(() => {
    if (!Array.isArray(logs)) return []
    return logs.filter((l) => l.status === 'error')
  }, [logs])

  // Agrupar por VARIABLE: una tarjeta por variable con sus valores incorrectos.
  const grouped = useMemo(() => {
    const map = {}
    errors.forEach((l) => {
      const col = l.column
      if (!map[col]) {
        map[col] = { column: col, count: 0, originales: new Set(), corrected: '' }
      }
      map[col].count += 1
      const orig = String(l.original ?? '').trim()
      map[col].originales.add(orig ? orig : 'vacío')
      const corr = String(l.corrected ?? '').trim()
      if (corr && !map[col].corrected) map[col].corrected = corr
    })
    return Object.values(map).map((g) => ({
      column: g.column,
      count: g.count,
      originales: [...g.originales].slice(0, 8),
      corrected: g.corrected,
    }))
  }, [errors])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = grouped
    if (q) {
      result = result.filter((g) =>
        (g.column || '').toLowerCase().includes(q) ||
        g.originales.some((o) => String(o).toLowerCase().includes(q)) ||
        String(g.corrected ?? '').toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      const va = sortCol === 'count' ? Number(a[sortCol]) : String(a[sortCol] ?? '').toLowerCase()
      const vb = sortCol === 'count' ? Number(b[sortCol]) : String(b[sortCol] ?? '').toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [grouped, query, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('desc') }
  }

  if (errors.length === 0) {
    return (
      <div className="panel flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--success-bg)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sin errores</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>La data cumple con el instructivo. No se encontraron inconsistencias.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="panel flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--danger-bg)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Errores encontrados</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Revisa las variables con datos incorrectos y corrígelas.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2' }}>
            {errors.length} error{errors.length !== 1 ? 'es' : ''}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)' }}>
            {grouped.length} variable{grouped.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder="Buscar por variable o dato..."
          className="input pl-10 text-sm"
        />
      </div>

      {/* Orden */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ordenar por:</span>
        {['count', 'column'].map((col) => (
          <button
            key={col}
            onClick={() => toggleSort(col)}
            className="text-xs font-medium px-2.5 py-1 rounded-full transition-all"
            style={{
              color: sortCol === col ? 'var(--green-800)' : 'var(--text-secondary)',
              backgroundColor: sortCol === col ? 'var(--green-100)' : 'transparent',
            }}
          >
            {col === 'count' ? 'Frecuencia' : 'Variable'}
            {sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
          </button>
        ))}
      </div>

      {/* Tarjetas por variable */}
      <div className="space-y-3">
        {pageItems.map((g, i) => (
          <div key={g.column + '-' + i} className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2' }}>
                  {g.count}
                </span>
                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{g.column}</span>
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                {g.count} {g.count === 1 ? 'fila' : 'filas'} con error
              </span>
            </div>
            <div className="pt-3 space-y-3">
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Lo que encontraste</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.originales.map((o, j) => (
                    <span
                      key={j}
                      className="text-xs font-medium px-2.5 py-1 rounded-md"
                      style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                    >
                      {mostrarValor(o)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Cómo corregirlo</div>
                <Correccion value={g.corrected} />
              </div>
            </div>
          </div>
        ))}

        {pageItems.length === 0 && (
          <div className="panel text-center py-10">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sin resultados para "&#171;{query}&#187;"</div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Página {safePage} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="btn-secondary px-2.5 py-1.5 text-xs rounded-lg">«</button>
            <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2.5 py-1.5 text-xs rounded-lg">←</button>
            <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2.5 py-1.5 text-xs rounded-lg">→</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="btn-secondary px-2.5 py-1.5 text-xs rounded-lg">»</button>
          </div>
        </div>
      )}
    </div>
  )
}