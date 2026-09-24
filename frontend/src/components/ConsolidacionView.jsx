import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { consolidateCargues, fetchCargues } from '../api'

export default function ConsolidacionView({ templates, templateKey = 'gestante' }) {
  const [mes, setMes] = useState('')
  const [cargues, setCargues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const list = await fetchCargues(templateKey)
        if (mounted) setCargues(list)
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los archivos.')
      }
    }
    load()
    return () => { mounted = false }
  }, [templateKey])

  const filtered = cargues.filter((c) => (!mes || c.mes === mes))
  const totalRegistros = filtered.reduce((s, c) => s + (c.row_count ?? 0), 0)

  const handleConsolidate = async () => {
    setLoading(true); setError(''); setConfirm(false)
    try {
      const blob = await consolidateCargues(templateKey, mes)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consolidada_${templateKey}${mes ? `_${mes}` : ''}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('No fue posible consolidar los datos. Verifica que los archivos estén validados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-600)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
          </svg>
        </div>
        <div>
          <div className="page-title">Consolidar</div>
          <div className="page-subtitle">Une los cargues validados en una sola hoja de datos.</div>
        </div>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>}

      <div className="panel space-y-5">
        {/* Período + resumen */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="form-label">Período (opcional)</label>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="input" style={{ maxWidth: 200 }} />
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Cargues</div>
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{filtered.length}</div>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Registros</div>
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{totalRegistros.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Archivos */}
        <div>
          <div className="section-label mb-2">Archivos disponibles para consolidar</div>
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div className="empty-title">Sin cargues</div>
              <div className="empty-desc">{mes ? `No hay cargues validados en ${mes}. Prueba con otro período.` : 'Aún no hay cargues validados para consolidar.'}</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Período</th>
                    <th className="text-center">Registros</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 'var(--weight-medium)' }}>{c.original_filename}</td>
                      <td><span className="badge-neutral">{c.mes}</span></td>
                      <td className="text-center">{(c.row_count ?? 0).toLocaleString()}</td>
                      <td className="text-center"><span className="badge-success">Validado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={() => setConfirm(true)} disabled={filtered.length === 0} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" /></svg>
            Consolidar datos
          </button>
        </div>
      </div>

      {/* Confirmación (portal: cubre toda la pantalla) */}
      {confirm && ReactDOM.createPortal(
        <div className="modal-overlay" onMouseDown={() => !loading && setConfirm(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3" style={{ marginBottom: 'var(--space-3)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-50)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--green-600)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" /></svg>
              </div>
              <div>
                <div className="modal-title" style={{ marginBottom: 'var(--space-1)' }}>Consolidar {filtered.length} cargue{filtered.length !== 1 ? 's' : ''}</div>
                <p className="modal-desc" style={{ marginBottom: 0 }}>
                  {mes ? `Período ${mes}. ` : ''}Se unirán en una sola hoja de datos ({totalRegistros.toLocaleString()} registros).
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setConfirm(false)} className="btn-secondary" disabled={loading}>Cancelar</button>
              <button onClick={handleConsolidate} className="btn-primary" disabled={loading}>{loading ? 'Consolidando...' : 'Consolidar'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
