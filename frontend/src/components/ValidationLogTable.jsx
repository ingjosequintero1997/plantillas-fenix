import React, { useMemo, useState } from 'react'

const PER_PAGE = 12

// Recorta fechas con hora (AAAA-MM-DD HH:MM:SS) a solo la fecha.
function mostrarValor(v) {
  const s = String(v ?? '').trim()
  if (!s) return '\u2014'
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/)
  return m ? m[1] : s
}

// Convierte el mensaje "Debe ser uno de: X, Y, Z" en chips de opciones.
function CorreccionCelda({ value }) {
  const s = String(value ?? '').trim()
  if (!s) return <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Revisa el valor</span>
  if (s.startsWith('Debe ser uno de:')) {
    const opciones = s.replace('Debe ser uno de:', '').split(',').map((o) => o.trim()).filter(Boolean)
    return (
      <div className="flex flex-wrap gap-1">
        {opciones.slice(0, 4).map((op, i) => (
          <span key={i} className="text-[0.7rem] font-medium px-2 py-0.5 rounded-md" style={{ color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0' }}>
            {op}
          </span>
        ))}
        {opciones.length > 4 && (
          <span className="text-[0.7rem] font-medium px-2 py-0.5 rounded-md" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)' }}>
            +{opciones.length - 4}
          </span>
        )}
      </div>
    )
  }
  return <span className="text-sm" style={{ color: '#166534' }}>{s}</span>
}

export default function ValidationLogTable({ logs }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const errors = useMemo(() => {
    if (!Array.isArray(logs)) return []
    return logs.filter((l) => l.status === 'error')
  }, [logs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return errors
    return errors.filter((l) =>
      String(l.row).includes(q) ||
      String(l.column ?? '').toLowerCase().includes(q) ||
      String(l.original ?? '').toLowerCase().includes(q) ||
      String(l.corrected ?? '').toLowerCase().includes(q)
    )
  }, [errors, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

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
    <div className="panel overflow-hidden">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2' }}>
              {errors.length} error{errors.length !== 1 ? 'es' : ''}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)' }}>
              {new Set(errors.map((l) => l.column)).size} variables
            </span>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Buscar fila, variable o dato..."
            className="input pl-8 text-sm py-1.5"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-wide" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
              <th className="px-4 py-2.5 font-semibold w-14">Fila</th>
              <th className="px-4 py-2.5 font-semibold">Variable</th>
              <th className="px-4 py-2.5 font-semibold">Valor actual</th>
              <th className="px-4 py-2.5 font-semibold">Cómo corregirlo</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((l, i) => (
              <tr
                key={`${l.row}-${l.column}-${i}`}
                className="align-top"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: i % 2 === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                }}
              >
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2' }}>
                    {l.row}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{l.column}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-block text-xs font-medium px-2 py-1 rounded-md" style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                    {mostrarValor(l.original)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <CorreccionCelda value={l.corrected} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pie: paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Mostrando {pageItems.length} de {filtered.length} errores
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs rounded-lg disabled:opacity-40">«</button>
            <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs rounded-lg disabled:opacity-40">←</button>
            <span className="text-xs px-2" style={{ color: 'var(--text-secondary)' }}>{safePage} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs rounded-lg disabled:opacity-40">→</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs rounded-lg disabled:opacity-40">»</button>
          </div>
        )}
      </div>
    </div>
  )
}