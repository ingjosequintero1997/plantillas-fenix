import React, { useEffect, useState } from 'react'
import { consolidateCargues, fetchCargues } from '../api'

export default function ConsolidacionView({ templates, templateKey = 'gestante' }) {
  const [mes, setMes] = useState('')
  const [cargues, setCargues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
      try { setCargues(await fetchCargues(templateKey)) }
      catch (e) { setError('No se pudieron cargar los archivos.') }
    }
    load()
  }, [templateKey])

  const filtered = cargues.filter((c) => (!mes || c.mes === mes))

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
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title">Consolidar</div>
          <div className="page-subtitle">Une los cargues de los prestadores en una sola data.</div>
        </div>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      <div className="panel space-y-4">
        <div>
          <label className="form-label">Período (opcional)</label>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="input max-w-xs" />
        </div>

        <div>
          <div className="section-label mb-2">Archivos disponibles para consolidar</div>
          {filtered.length === 0 ? (
            <div className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
              No hay cargues disponibles para consolidar con el período seleccionado.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Período</th>
                    <th>Registros</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.original_filename}</td>
                      <td>{c.mes}</td>
                      <td>{c.row_count ?? 0}</td>
                      <td><span className="badge-success">Validado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={() => setConfirm(true)} disabled={filtered.length === 0} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {loading ? 'Consolidando...' : 'Consolidar datos'}
          </button>
        </div>
      </div>

      {/* Confirmación */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">¿Consolidar datos?</div>
            <div className="modal-desc">Se unirán {filtered.length} cargues validados en una sola hoja de datos.</div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setConfirm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleConsolidate} className="btn-primary" disabled={loading}>{loading ? 'Consolidando...' : 'Consolidar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}