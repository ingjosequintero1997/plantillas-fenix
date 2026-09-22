import React, { useState } from 'react'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function PeriodoPicker({ value, onChange, disabled = false }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [year, setYear] = useState(() => (value ? Number(value.slice(0, 4)) : currentYear))

  const valueYear = value ? Number(value.slice(0, 4)) : null
  const valueMonth = value ? Number(value.slice(5, 7)) : null
  const selectedMonth = valueYear === year ? valueMonth : null

  const pick = (m) => {
    if (disabled) return
    onChange(`${year}-${String(m).padStart(2, '0')}`)
  }

  return (
    <div className="panel">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-600)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <div className="section-label">Periodo del cargue</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Selecciona el mes y año al que corresponde la data antes de adjuntar el archivo.</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3" style={{ maxWidth: 340 }}>
        <button type="button" className="btn-secondary" style={{ padding: '6px 10px' }} disabled={disabled}
          onClick={() => setYear((y) => y - 1)} aria-label="Año anterior">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{year}</div>
        <button type="button" className="btn-secondary" style={{ padding: '6px 10px' }} disabled={disabled}
          onClick={() => setYear((y) => y + 1)} aria-label="Año siguiente">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" style={{ maxWidth: 520 }}>
        {MESES.map((m, i) => {
          const num = i + 1
          const isSel = selectedMonth === num
          const isCurrent = year === currentYear && num === currentMonth
          return (
            <button
              key={m}
              type="button"
              onClick={() => pick(num)}
              disabled={disabled}
              className="text-sm font-medium rounded-lg transition-all"
              style={{
                padding: '9px 4px',
                border: `1px solid ${isSel ? 'var(--green-500)' : 'var(--border-subtle)'}`,
                backgroundColor: isSel ? 'var(--green-50)' : 'var(--bg-surface)',
                color: isSel ? 'var(--green-700)' : 'var(--text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: isSel ? 'inset 0 0 0 1px var(--green-500)' : 'none',
              }}
            >
              {m}
              {isCurrent && <span style={{ display: 'block', fontSize: '0.55rem', fontWeight: 600, color: isSel ? 'var(--green-600)' : 'var(--text-muted)', marginTop: 1 }}>Actual</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-sm flex items-center gap-2" style={{ color: value ? 'var(--green-700)' : 'var(--text-muted)' }}>
        {value ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Periodo seleccionado: <strong style={{ fontWeight: 600 }}>{MESES_LARGO[(valueMonth || 1) - 1]} {valueYear}</strong>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Ningún periodo seleccionado. Debes elegir uno para habilitar la carga.
          </>
        )}
      </div>
    </div>
  )
}
