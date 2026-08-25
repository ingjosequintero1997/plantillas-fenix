import React from 'react'

// Bandeja visual de calidad para el modo validador. Pensada para prestadores
// no tecnicos: muestra en una sola mirada que tan bien esta la data y cuantas
// filas faltan por corregir, en lenguaje sencillo.
export default function QualityBanner({ summary, mode }) {
  const total = Number(summary?.total ?? 0)
  const errores = Number(summary?.rows_with_errors ?? summary?.errors ?? 0)
  const ok = Math.max(0, total - errores)
  const pct = Number(summary?.quality_percent ?? (total ? Math.round((100 * ok) / total) : 0))
  const corrige = Number(summary?.corrected ?? 0)

  const nivel = pct >= 90 ? 'bien' : pct >= 60 ? 'medio' : 'mal'

  const colores = {
    bien: { barra: 'var(--green-400)', fondo: 'var(--green-50)', texto: 'var(--green-800)', borde: 'var(--green-300)' },
    medio: { barra: '#F59E0B', fondo: '#FFFBEB', texto: '#92400E', borde: '#FCD34D' },
    mal: { barra: '#EF4444', fondo: '#FEF2F2', texto: '#991B1B', borde: '#FCA5A5' },
  }
  const c = colores[nivel]

  const mensaje =
    total === 0
      ? 'No se encontraron registros para validar.'
      : nivel === 'bien'
        ? `Tu data está al ${pct}%. ${errores === 0 ? 'Todo quedó validado correctamente.' : `Faltan ${errores} ${errores === 1 ? 'fila' : 'filas'} por corregir.`}`
        : nivel === 'medio'
          ? `Tu data está al ${pct}%. Faltan ${errores} ${errores === 1 ? 'fila' : 'filas'} por corregir. Revisa la lista de errores y corrige las celdas marcadas.`
          : `Tu data está al ${pct}%. Hay ${errores} ${errores === 1 ? 'fila' : 'filas'} con errores. Corrige los datos marcados abajo y vuelve a validar.`

  const subtexto =
    mode === 'validador'
      ? `${ok} ${ok === 1 ? 'fila' : 'filas'} correctas · ${errores} ${errores === 1 ? 'fila con error' : 'filas con error'}`
      : `${ok} ${ok === 1 ? 'fila' : 'filas'} correctas · ${corrige} celdas ajustadas`

  return (
    <div
      className="rounded-xl px-4 py-4"
      style={{ backgroundColor: c.fondo, border: `1px solid ${c.borde}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: nivel === 'bien' ? '#DCF1DF' : nivel === 'medio' ? '#FEF3C7' : '#FEE2E2' }}
        >
          {nivel === 'bien' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--green-700)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ color: c.texto }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: c.texto }}>{mensaje}</div>
            <div className="text-2xl font-bold shrink-0" style={{ color: c.texto }}>{pct}%</div>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: nivel === 'bien' ? '#DCF1DF' : nivel === 'medio' ? '#FDE68A' : '#FECACA' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: c.barra }} />
          </div>
          <div className="mt-1.5 text-xs" style={{ color: c.texto, opacity: 0.85 }}>{subtexto}</div>
        </div>
      </div>
    </div>
  )
}