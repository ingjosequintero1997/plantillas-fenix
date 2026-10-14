import React, { useMemo, useState } from 'react'

const PER_PAGE = 12
const MAX_CHIPS = 6

// Recorta fechas con hora (AAAA-MM-DD HH:MM:SS) a solo la fecha.
// Cuando el valor viene vacio (obligatorio o error cruzado) muestra un placeholder claro.
function mostrarValor(v) {
  const s = String(v ?? '').trim()
  if (!s) return '(vacío)'
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/)
  return m ? m[1] : s
}

// El backend pone el marcador en medio del mensaje (ej: "El valor 'X' no es valido.
// Debe ser uno de: Femenino"). Extrae las opciones que vienen despues del marcador.
// Devuelve null cuando el mensaje no lista opciones (fecha, entero, obligatorio, etc.).
function extraerOpciones(mensaje) {
  const marcador = 'Debe ser uno de:'
  const s = String(mensaje ?? '')
  const idx = s.indexOf(marcador)
  if (idx === -1) return null
  return s
    .slice(idx + marcador.length)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

// Muestra el mensaje de error y, si lista valores validos, los renderiza como chips.
function CorreccionCelda({ value }) {
  const s = String(value ?? '').trim()
  if (!s) return <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Revisa el valor</span>
  const opciones = extraerOpciones(s)
  if (opciones && opciones.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>{s}</span>
        <div className="flex flex-wrap gap-1">
          {opciones.slice(0, MAX_CHIPS).map((op, i) => (
            <span key={i} className="text-[0.7rem] font-medium px-2 py-0.5 rounded-md" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}>
              {op}
            </span>
          ))}
          {opciones.length > MAX_CHIPS && (
            <span className="text-[0.7rem] font-medium px-2 py-0.5 rounded-md" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)' }}>
              +{opciones.length - MAX_CHIPS}
            </span>
          )}
        </div>
      </div>
    )
  }
  return <span className="text-sm" style={{ color: 'var(--success)' }}>{s}</span>
}

export default function ValidationLogTable({ logs, showCorrected = false }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const errors = useMemo(() => {
    if (!Array.isArray(logs)) return []
    return logs.filter((l) => l.status === 'error')
  }, [logs])

  // Celdas que el limpiador CORRIGIO (solo se listan en modo limpiador).
  const corrected = useMemo(() => {
    if (!Array.isArray(logs) || !showCorrected) return []
    return logs.filter((l) => l.status === 'corrected')
  }, [logs, showCorrected])

  // En limpiador se listan las celdas corregidas + los errores que quedan
  // (que el usuario vea "lo que limpio vs lo que hay que arreglar").
  const entries = useMemo(() => {
    if (corrected.length === 0) return errors
    return [...errors, ...corrected].sort(
      (a, b) => (Number(a.row) - Number(b.row)) || String(a.column ?? '').localeCompare(String(b.column ?? ''))
    )
  }, [errors, corrected])

  const filasConError = useMemo(() => new Set(errors.map((l) => l.row)).size, [errors])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((l) =>
      String(l.row).includes(q) ||
      String(l.column ?? '').toLowerCase().includes(q) ||
      String(l.original ?? '').toLowerCase().includes(q) ||
      String(l.corrected ?? '').toLowerCase().includes(q)
    )
  }, [entries, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (entries.length === 0) {
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
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
              {filasConError} fila{filasConError !== 1 ? 's' : ''} con error
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-bg)' }}>
              {errors.length} celda{errors.length !== 1 ? 's' : ''} con error
            </span>
            {corrected.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)' }}>
                {corrected.length} corregida{corrected.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)' }}>
              {new Set(errors.map((l) => String(l.column ?? 'Sin variable'))).size} variables
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
              <th className="px-4 py-2.5 font-semibold">{showCorrected ? 'Valor previo' : 'Valor actual'}</th>
              <th className="px-4 py-2.5 font-semibold">{showCorrected ? 'Valor corregido / error' : 'Error / cómo corregirlo'}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((l, i) => {
              const esCorregida = l.status === 'corrected'
              return (
              <tr
                key={`${l.row}-${l.column}-${i}`}
                className="align-top"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: i % 2 === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                }}
              >
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold" style={{ color: esCorregida ? 'var(--success)' : 'var(--danger)', backgroundColor: esCorregida ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
                    {l.row}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{String(l.column ?? 'Sin variable')}</div>
                </td>
                <td className="px-4 py-2.5">
                  {esCorregida ? (
                    <span className="inline-block text-xs font-medium px-2 py-1 rounded-md" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                      {mostrarValor(l.original)}
                    </span>
                  ) : String(l.original ?? '').trim() === '' ? (
                    <span className="inline-block text-xs font-medium px-2 py-1 rounded-md" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', border: '1px dashed var(--border-subtle)' }}>
                      {mostrarValor(l.original)}
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-medium px-2 py-1 rounded-md" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
                      {mostrarValor(l.original)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {esCorregida ? (
                    <span className="inline-block text-xs font-medium px-2 py-1 rounded-md" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}>
                      {mostrarValor(l.corrected)}
                    </span>
                  ) : (
                    <CorreccionCelda value={l.corrected} />
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pie: paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Mostrando {pageItems.length} de {filtered.length} {showCorrected ? 'celdas (corregidas y errores)' : 'celdas con error'}
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