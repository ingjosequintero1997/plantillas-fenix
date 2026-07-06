import React, { useMemo, useState } from 'react'
import Pagination from './Pagination'

const PER_PAGE = 40

function buildLogMap(logs) {
  const map = {}
  logs.forEach(l=>{
    const r = l.row
    const c = l.column
    if (!map[r]) map[r] = {}
    map[r][c] = l.status
  })
  return map
}

export default function DataGridTable({ corrected_text, templateColumns, logs }) {
  const rows = useMemo(() => {
    if (!corrected_text) return []
    return corrected_text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((row) => row.split('|'))
  }, [corrected_text])

  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState(0)
  const [page, setPage] = useState(1)
  const logMap = buildLogMap(logs || [])

  const filteredIndexes = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows.map((_, idx) => idx)
    return rows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => row.join(' ').toLowerCase().includes(q))
      .map(({ idx }) => idx)
  }, [rows, search])

  const paginatedIndexes = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return filteredIndexes.slice(start, start + PER_PAGE)
  }, [filteredIndexes, page])

  const totalPages = Math.ceil(filteredIndexes.length / PER_PAGE)

  const safeSelected = filteredIndexes.includes(selectedRow)
    ? selectedRow
    : (filteredIndexes[0] ?? 0)

  const activeRow = rows[safeSelected] || []

  const rowStatus = (rowIndex) => {
    const rowLogs = logMap[rowIndex + 1] || {}
    const statuses = Object.values(rowLogs)
    if (statuses.includes('error')) return { label: 'Errores', cls: 'badge-red' }
    if (statuses.includes('corrected')) return { label: 'Corregido', cls: 'badge-green' }
    return { label: 'Correcto', cls: 'badge-gray' }
  }

  const cellStatus = (rowIndex, columnName) => {
    const status = (logMap[rowIndex + 1] && logMap[rowIndex + 1][columnName]) || 'ok'
    if (status === 'error') return { cls: 'border-red-200 bg-red-50/30 text-red-600', label: 'Error' }
    if (status === 'corrected') return { cls: 'border-brand-200 bg-brand-50/40 text-ink', label: 'Corregido' }
    return { cls: 'border-ink-line/40 bg-white text-ink', label: 'Ok' }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-ink-line/50 bg-[#F8F7F4] p-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-bold text-ink">
            Registros: <span className="text-ink-muted font-semibold">{rows.length}</span>
            <span className="mx-2 text-ink-line">·</span>
            Visibles: <span className="text-ink-muted font-semibold">{filteredIndexes.length}</span>
        </div>
        <div className="relative md:w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar en los datos"
            className="input pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="max-h-[620px] overflow-auto rounded-xl border border-ink-line/50 bg-white p-2 scroll-thin shadow-sm">
          {filteredIndexes.length === 0 && (
            <div className="p-4 text-sm text-ink-muted text-center">Sin resultados para este filtro</div>
          )}
          <div className="space-y-2">
            {paginatedIndexes.map((idx) => {
              const status = rowStatus(idx)
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedRow(idx)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-150 ${
                    safeSelected === idx
                      ? 'ring-2 ring-brand-800/15 shadow-md border-brand-800/30'
                      : 'border-ink-line/50 bg-white hover:border-ink-line/70 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-ink">Registro {idx + 1}</div>
                    <span className={`text-[0.45rem] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${status.cls}`}>{status.label}</span>
                  </div>
                  <div className="mt-1.5 text-xs text-ink-muted truncate">{(rows[idx] || []).slice(0, 3).join(' | ')}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="max-h-[620px] overflow-auto rounded-xl border border-ink-line/50 bg-white p-3 md:p-4 scroll-thin shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 sticky top-0 bg-white pb-2 border-b border-ink-line/50">
            <h3 className="text-sm font-bold text-ink">Registro {safeSelected + 1}</h3>
            <span className={`text-[0.45rem] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${rowStatus(safeSelected).cls}`}>
              {rowStatus(safeSelected).label}
            </span>
          </div>

          <div className="space-y-2">
            {templateColumns.map((col, ci) => {
              const value = activeRow[ci] || '—'
              const status = cellStatus(safeSelected, col)
              return (
                <div key={`${col}-${ci}`} className={`rounded-xl border p-3 transition-colors ${status.cls}`}>
                  <div className="mb-1 text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">{col}</div>
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-medium text-ink break-words">{value}</div>
                    <span className={`text-[0.4rem] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                      status.label === 'Error' ? 'badge-red' : status.label === 'Corregido' ? 'badge-green' : 'badge-gray'
                    }`}>{status.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
