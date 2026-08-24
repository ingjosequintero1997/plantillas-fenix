import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'

const PER_PAGE = 25

function parseData(rawText, templateNames) {
  if (!rawText || !templateNames || templateNames.length === 0) return []
  const lines = rawText.trim().split('\n').filter((l) => l.trim().length > 0)
  return lines.map((line, idx) => {
    const cols = line.split('|')
    const row = {}
    templateNames.forEach((name, ci) => {
      row[name] = cols[ci] || ''
    })
    row._rowNum = idx + 1
    return row
  })
}

export default function EditableDataTable({ logs, rawText, templateNames, onRevalidate, loading }) {
  const [data, setData] = useState(() => parseData(rawText, templateNames))
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editingCell, setEditingCell] = useState(null)
  const [editedCells, setEditedCells] = useState(() => new Set())
  const prevRawRef = useRef(rawText)

  // Sincronizar la tabla cuando rawText cambia (despues de re-validar).
  // Las celdas que el usuario edito se conservan porque rawText ya las contiene.
  useEffect(() => {
    if (rawText !== prevRawRef.current) {
      setData(parseData(rawText, templateNames))
      prevRawRef.current = rawText
    }
  }, [rawText, templateNames])

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

  const hasErrors = useMemo(() => Array.isArray(logs) && logs.some((l) => l.status === 'error'), [logs])

  const errorRows = useMemo(() => {
    const set = new Set()
    if (Array.isArray(logs)) logs.forEach((l) => { if (l.status === 'error') set.add(l.row) })
    return set
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
    const realRowIdx = (safePage - 1) * PER_PAGE + rowIdx
    setData((prev) => {
      const next = [...prev]
      if (realRowIdx < next.length) {
        const rowNum = next[realRowIdx]._rowNum
        next[realRowIdx] = { ...next[realRowIdx], [colName]: value }
        setEditedCells((prevSet) => {
          const s = new Set(prevSet)
          s.add(rowNum + '-' + colName)
          return s
        })
      }
      return next
    })
    setEditingCell(null)
  }, [safePage])

  const buildRawText = useCallback(() => {
    if (!templateNames || templateNames.length === 0) return ''
    const rows = data.map((row) =>
      templateNames.map((name) => row[name] || '').join('|')
    )
    return rows.join('\n')
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
      {/* Mensaje de resultado tras re-validar */}
      {!hasErrors && logs.length > 0 ? (
        <div className="panel" style={{ borderColor: 'var(--green-300)', backgroundColor: 'var(--green-50)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>La data qued&oacute; validada correctamente</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>No hay errores pendientes. Puedes descargar el reporte o validar otra data.</div>
            </div>
          </div>
        </div>
      ) : hasErrors ? (
        <div className="panel" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>A&uacute;n hay errores que corregir</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Las celdas con error se marcan en rojo. Corrige y vuelve a pulsar Re-validar.</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="panel">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--green-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Haz clic sobre una celda para corregirla manualmente. Despu&eacute;s pulsa <strong style={{ color: 'var(--text-primary)' }}>Re-validar</strong> para volver a validar la data contra el instructivo.
          </div>
        </div>
      </div>
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
            {errorRows.size > 0 && <span className="badge-error">{errorRows.size} filas con error</span>}
            {editedCells.size > 0 && <span className="badge-success">{editedCells.size} celdas editadas</span>}
          </div>
          <button onClick={handleRevalidate} disabled={loading} className="btn-primary text-sm" title="Vuelve a validar la data con los cambios que hiciste manualmente en las celdas.">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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
              {pageItems.map((row, ri) => {
                const rowHasError = errorRows.has(row._rowNum)
                return (
                  <tr key={row._rowNum} style={{ backgroundColor: rowHasError ? '#FFF7F7' : 'transparent' }}>
                    <td className="font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>{row._rowNum}</td>
                    {visibleCols.map((col) => {
                      const cellKey = row._rowNum + '-' + col
                      const hasError = !!errorCells[cellKey]
                      const isEditing = editingCell === cellKey
                      const wasEdited = editedCells.has(cellKey)
                      const isAccepted = wasEdited && !hasError
                      const val = row[col] || ''
                      let bg = 'transparent'
                      if (isAccepted) bg = '#ECFDF5'
                      if (hasError) bg = '#FEF2F2'
                      return (
                        <td
                          key={col}
                          onClick={() => setEditingCell(cellKey)}
                          className="cursor-pointer"
                          style={{
                            backgroundColor: bg,
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
                            <span className="text-xs block truncate" style={{ color: hasError ? '#B91C1C' : isAccepted ? '#047857' : 'var(--text-primary)' }}>
                              {val || <span style={{ color: 'var(--text-muted)' }}>vac&iacute;o</span>}
                              {isAccepted && <span className="ml-1" style={{ color: '#059669' }}>&#10003;</span>}
                            </span>
                          )}
                          {hasError && !isEditing && (
                            <span className="text-[0.6rem] block mt-0.5" style={{ color: '#DC2626' }}>{errorCells[cellKey]}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              P&aacute;gina {safePage} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs">&laquo;</button>
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2 py-1 text-xs">&larr;</button>
              <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs">&rarr;</button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="btn-secondary px-2 py-1 text-xs">&raquo;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}