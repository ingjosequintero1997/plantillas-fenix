import React, { useMemo, useState, useCallback } from 'react'

const PER_PAGE = 25

export default function EditableDataTable({ logs, rawText, templateNames, onRevalidate, loading }) {
  const [data, setData] = useState(() => {
    if (!rawText || !templateNames || templateNames.length === 0) return []
    const lines = rawText.trim().split('\n')
    return lines.slice(1).map((line, idx) => {
      const cols = line.split('|')
      const row = {}
      templateNames.forEach((name, ci) => {
        row[name] = cols[ci] || ''
      })
      row._rowNum = idx + 1
      return row
    })
  })
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editingCell, setEditingCell] = useState(null)

  const errorCells = useMemo(() => {
    const cells = {}
    if (!Array.isArray(logs)) return cells
    logs.forEach((l) => {
      if (l.status === 'error') {
        const key = l.row + '-' + l.column
        cells[key] = l.corrected
      }
    })
    return cells
  }, [logs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }, [data, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleCellEdit = useCallback((rowIdx, colName, value) => {
    setData((prev) => {
      const next = [...prev]
      const realRowIdx = (safePage - 1) * PER_PAGE + rowIdx
      if (realRowIdx < next.length) {
        next[realRowIdx] = { ...next[realRowIdx], [colName]: value }
      }
      return next
    })
    setEditingCell(null)
  }, [safePage])

  const buildRawText = useCallback(() => {
    if (!templateNames || templateNames.length === 0) return ''
    const header = templateNames.join('|')
    const rows = data.map((row) =>
      templateNames.map((name) => row[name] || '').join('|')
    )
    return [header, ...rows].join('\n')
  }, [data, templateNames])

  const handleRevalidate = useCallback(() => {
    const newText = buildRawText()
    if (onRevalidate) onRevalidate(newText)
  }, [buildRawText, onRevalidate])

  if (!data.length) {
    return (
      <div className="panel">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No hay datos para editar.</p>
      </div>
    )
  }

  const visibleCols = templateNames || Object.keys(data[0] || {}).filter((k) => !k.startsWith('_'))

  return (
    <div className="space-y-4">
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Buscar..."
                className="input pl-9 text-sm"
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{data.length} registros</span>
          </div>
          <button onClick={handleRevalidate} disabled={loading} className="btn-primary text-sm">
            {loading ? 'Re-validando...' : 'Re-validar'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                {visibleCols.map((col) => (
                  <th key={col} className="whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((row, ri) => (
                <tr key={row._rowNum}>
                  <td className="font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>{row._rowNum}</td>
                  {visibleCols.map((col) => {
                    const cellKey = row._rowNum + '-' + col
                    const hasError = !!errorCells[cellKey]
                    const isEditing = editingCell === cellKey
                    const val = row[col] || ''
                    return (
                      <td
                        key={col}
                        onClick={() => setEditingCell(cellKey)}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: hasError ? '#FEF2F2' : 'transparent',
                          minWidth: 120,
                          maxWidth: 200,
                        }}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={val}
                            onBlur={(e) => handleCellEdit(ri, col, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCellEdit(ri, col, e.target.value) }}
                            className="w-full text-xs px-1.5 py-1 rounded border"
                            style={{ borderColor: 'var(--green-400)', outline: 'none' }}
                          />
                        ) : (
                          <span className="text-xs block truncate" style={{ color: hasError ? '#B91C1C' : 'var(--text-primary)' }}>
                            {val || <span style={{ color: 'var(--text-muted)' }}>vac&iacute;o</span>}
                          </span>
                        )}
                        {hasError && !isEditing && (
                          <span className="text-[0.6rem] block mt-0.5" style={{ color: '#DC2626' }}>{errorCells[cellKey]}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              P\u00e1gina {safePage} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs">\u00AB</button>
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs">\u2190</button>
              <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs">\u2192</button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs">\u00BB</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}