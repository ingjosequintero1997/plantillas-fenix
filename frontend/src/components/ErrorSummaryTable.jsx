import React, { useMemo, useState } from 'react'

const PER_PAGE = 20

// Si el valor parece fecha con hora (AAAA-MM-DD HH:MM:SS), la recorta a solo
// la fecha para mostrarla sin el componente de hora.
function mostrarValor(v) {
  const s = String(v ?? '').trim()
  if (!s) return '\u2014'
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/)
  return m ? m[1] : s
}

// Si el "dato esperado" es una lista (ej: "Debe ser uno de: CC, TI, CE"),
// separa el mensaje y muestra las opciones como etiquetas.
function EsperadoCell({ value }) {
  const s = String(value ?? '').trim()
  if (!s) return <span className="text-xs px-2 py-1 rounded-md break-all" style={{ color: '#166534', backgroundColor: '#DCFCE7' }}>&mdash;</span>
  if (s.startsWith('Debe ser uno de:')) {
    const opciones = s.replace('Debe ser uno de:', '').split(',').map((o) => o.trim()).filter(Boolean)
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs" style={{ color: '#166534' }}>Debe ser uno de:</span>
        <div className="flex flex-wrap gap-1">
          {opciones.map((op, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ color: '#166534', backgroundColor: '#DCFCE7' }}>{op}</span>
          ))}
        </div>
      </div>
    )
  }
  return <span className="text-xs px-2 py-1 rounded-md break-all" style={{ color: '#166534', backgroundColor: '#DCFCE7' }}>{s}</span>
}

export default function ErrorSummaryTable({ logs }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState('count')
  const [sortDir, setSortDir] = useState('desc')

  const errors = useMemo(() => {
    if (!Array.isArray(logs)) return []
    // Solo mostrar celdas realmente incorrectas (no corregidas automaticamente).
    return logs.filter((l) => l.status === 'error')
  }, [logs])

  // Agrupar errores iguales: misma variable + mismo dato + misma correccion.
  // Asi el mismo error en muchas filas se muestra UNA sola vez, con su conteo.
  const grouped = useMemo(() => {
    const map = {}
    errors.forEach((l) => {
      const key = `${l.column}||${String(l.original ?? '')}||${String(l.corrected ?? '')}`
      if (!map[key]) {
        map[key] = { column: l.column, original: l.original, corrected: l.corrected, count: 0, ejemploFila: l.row }
      }
      map[key].count += 1
    })
    return Object.values(map)
  }, [errors])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = grouped
    if (q) {
      result = result.filter((g) =>
        (g.column || '').toLowerCase().includes(q) ||
        String(g.original ?? '').toLowerCase().includes(q) ||
        String(g.corrected ?? '').toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol]
      if (sortCol === 'count') { va = Number(va); vb = Number(vb) }
      if (sortCol === 'original' || sortCol === 'corrected') { va = String(va ?? ''); vb = String(vb ?? '') }
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
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  if (errors.length === 0) {
    return (
      <div className="panel">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Sin errores</span>
        </div>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>La data cumple con el instructivo. No se encontraron inconsistencias.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="panel">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              Resumen de errores
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-error">{errors.length} error{errors.length !== 1 ? 'es' : ''}</span>
            <span className="badge-neutral">{grouped.length} tipo{grouped.length !== 1 ? 's' : ''} de error</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Buscar por variable o dato..."
              className="input pl-9 text-sm"
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} tipo{filtered.length !== 1 ? 's' : ''} de error
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('count')} className="cursor-pointer select-none">Filas {sortCol === 'count' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}</th>
                <th onClick={() => toggleSort('column')} className="cursor-pointer select-none">Variable {sortCol === 'column' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}</th>
                <th onClick={() => toggleSort('original')} className="cursor-pointer select-none">Lo que pusiste {sortCol === 'original' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}</th>
                <th onClick={() => toggleSort('corrected')} className="cursor-pointer select-none">Cómo corregirlo {sortCol === 'corrected' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((g, i) => (
                <tr key={g.column + '-' + i}>
                  <td className="font-medium whitespace-nowrap" style={{ color: 'var(--error)' }}>{g.count}</td>
                  <td>
                    <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                      {g.column}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-1 rounded-md break-all" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2' }}>
                      {mostrarValor(g.original) || <em style={{ color: '#B91C1C' }}>vacío</em>}
                    </span>
                  </td>
                  <td>
                    <EsperadoCell value={g.corrected} />
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6" style={{ color: 'var(--text-secondary)' }}>Sin resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Página {safePage} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs">«</button>
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs">←</button>
              <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs">→</button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}