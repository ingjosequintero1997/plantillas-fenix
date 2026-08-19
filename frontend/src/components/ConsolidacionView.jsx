import React, { useEffect, useState } from 'react'
import { consolidateCargues, fetchCargues } from '../api'

export default function ConsolidacionView({ templates, templateKey = 'gestante' }) {
  const [mes, setMes] = useState('')
  const [cargues, setCargues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCargues(templateKey)
        setCargues(data)
      } catch (e) {
        setError(e.message || 'No se pudo cargar el historial')
      }
    }
    load()
  }, [templateKey])

  const handleConsolidate = async () => {
    setLoading(true); setError('')
    try {
      const blob = await consolidateCargues(templateKey, mes)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const suffix = mes ? `_${mes}` : ''
      a.href = url
      a.download = `consolidada_${templateKey}${suffix}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Error al consolidar la data')
    } finally {
      setLoading(false)
    }
  }

  const filtered = cargues.filter((c) => c.template_key === templateKey && (!mes || c.mes === mes))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-md shadow-brand-900/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5zM4 15a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm8 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-ink tracking-tight">Consolidar data</h2>
          <p className="text-xs text-ink-muted/60 mt-0.5">Une los cargues mensuales de todos los prestadores en una sola hoja Excel</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-1">
          <div>
            <label className="block text-[0.55rem] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Mes (opcional)</label>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="input" />
          </div>
        </div>

        <div className="rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-[#F8F7F4] dark:bg-[#28282B] p-4">
          <div className="text-xs text-ink-muted mb-2">
            <span className="font-bold text-ink">{filtered.length}</span> cargues serán consolidados
          </div>
          {filtered.length === 0 && (
            <div className="text-xs text-ink-faint">No hay cargues para este filtro todavía.</div>
          )}
          <div className="max-h-40 overflow-auto scroll-thin space-y-1.5">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 px-3 py-2 text-xs">
                <span className="font-semibold text-ink truncate">{c.original_filename}</span>
                <span className="text-ink-muted shrink-0 ml-2">{c.mes} · {c.row_count} registros</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleConsolidate} disabled={loading || filtered.length === 0}
          className="btn-primary shadow-lg shadow-brand-900/20 w-full md:w-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {loading ? 'Consolidando...' : 'Consolidar y descargar'}
        </button>
      </div>
    </div>
  )
}
