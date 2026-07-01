import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from 'recharts'
import { evaluateData } from '../api'

const META_LABELS = {
  'Bueno > 50% | Aceptable 30-50% | Crítico < 30%': { bueno: 50, aceptable: 30 },
  'Bueno > 60% | Aceptable 40-60% | Crítico < 40%': { bueno: 60, aceptable: 40 },
  '> 60%': { bueno: 60, aceptable: 60 },
}

function getLevel(value, metaStr) {
  const meta = META_LABELS[metaStr]
  if (!meta) return 'neutral'
  const num = parseFloat(value)
  if (isNaN(num)) return 'neutral'
  if (num >= meta.bueno) return 'bueno'
  if (num >= meta.aceptable) return 'aceptable'
  return 'critico'
}

export default function EvaluationDashboard({
  correctedText, templateNames, selectedTemplate, onClose,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterIndicator, setFilterIndicator] = useState('all')
  const [downloading, setDownloading] = useState(false)

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const result = await evaluateData(correctedText, templateNames, selectedTemplate, 'json')
        setData(result)
      } catch (e) {
        setError(e.message || 'Error al obtener evaluación')
      } finally {
        setLoading(false)
      }
    })()
  }, [correctedText, templateNames, selectedTemplate])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.indicators.map((ind) => {
      const raw = parseFloat(String(ind.CUMPLIMIENTO).replace('%', '').replace(',', '.'))
      return {
        name: ind.INDICADOR.length > 30 ? ind.INDICADOR.slice(0, 30) + '…' : ind.INDICADOR,
        fullName: ind.INDICADOR,
        value: isNaN(raw) ? 0 : raw,
        meta: ind.META,
        numerador: ind.NUMERADOR,
        denominador: ind.DENOMINADOR,
      }
    })
  }, [data])

  const patientsWithFlags = useMemo(() => {
    if (!data) return []
    return data.patients.map((p, idx) => {
      const row = { _index: idx + 1 }
      for (const col of data.data_columns) {
        row[col] = p[col] ?? ''
      }
      for (const col of data.eval_columns) {
        row[col] = p[col] ?? 'NO'
      }
      return row
    })
  }, [data])

  const filteredPatients = useMemo(() => {
    if (filterIndicator === 'all') return patientsWithFlags
    const colMap = {
      'Diabéticos controlados': '_DM_CONTROLADO',
      'Control PA < 140/90': '_PA_140_90',
      'Control PA < 150/90': '_PA_150_90',
      'Captación HTA 18-69 subsidiado': '_HTA_CAPTADO',
      'Captación DM 18-69 subsidiado': '_DM_CAPTADO',
    }
    const col = colMap[filterIndicator]
    if (!col) return patientsWithFlags
    return patientsWithFlags.filter((p) => p[col] === 'SI')
  }, [patientsWithFlags, filterIndicator])

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true)
      const blob = await evaluateData(correctedText, templateNames, selectedTemplate, 'xlsx')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evaluacion_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Error al descargar Excel')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-10 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <svg className="w-10 h-10 text-brand-800 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-ink-muted">Evaluando indicadores…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 animate-fade-in-up">
        <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-sm text-red-600 flex items-start gap-3">
          <span className="font-medium">{error}</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  const totalEvalCols = data.eval_columns.filter((c) => c !== '_POBLACION_HTA' && c !== '_POBLACION_DM')

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ─── Header ─── */}
      <div className="card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-600 via-amber-500 to-amber-400" />
        <div className="relative px-7 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1 mb-2 ring-1 ring-amber-200/50">
              <div className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="text-[0.55rem] font-bold text-amber-800 tracking-[0.15em] uppercase">Dashboard</span>
            </div>
            <h2 className="text-xl font-extrabold text-ink tracking-tight">
              Evaluación de indicadores RCV
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              {data.total_patients} pacientes evaluados &middot; {data.indicators.length} indicadores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadExcel} disabled={downloading}
              className="btn bg-amber-500 text-white hover:bg-amber-600 shadow-button hover:shadow-button-hover">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {downloading ? 'Descargando…' : 'Descargar Excel'}
            </button>
            <button onClick={onClose}
              className="btn bg-white text-ink border border-ink-line/70 hover:bg-surface-50 shadow-button">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chartData.map((item) => {
          const level = getLevel(item.value, item.meta)
          const colors = {
            bueno: { bg: 'bg-green-50 border-green-200/60', text: 'text-green-700', bar: 'bg-green-500', dot: 'bg-green-500' },
            aceptable: { bg: 'bg-amber-50 border-amber-200/60', text: 'text-amber-700', bar: 'bg-amber-500', dot: 'bg-amber-500' },
            critico: { bg: 'bg-red-50 border-red-200/60', text: 'text-red-700', bar: 'bg-red-500', dot: 'bg-red-500' },
            neutral: { bg: 'bg-gray-50 border-gray-200/60', text: 'text-gray-700', bar: 'bg-gray-400', dot: 'bg-gray-400' },
          }
          const c = colors[level]
          return (
            <div key={item.fullName} className={`card p-4 ${c.bg} relative overflow-hidden`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">
                  {item.fullName}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-3xl font-extrabold ${c.text}`}>
                  {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}%
                </span>
                <span className="text-xs text-ink-muted">
                  {item.numerador}/{item.denominador}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-line/40 overflow-hidden">
                <div className={`h-full rounded-full ${c.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(item.value, 100)}%` }} />
              </div>
              <div className="mt-2 flex gap-2 text-[0.5rem] font-semibold uppercase tracking-wider">
                <span className="text-green-600">≥{item.meta.includes('50') ? '50' : '60'}%</span>
                {item.meta.includes('30') && <span className="text-amber-600">30-50%</span>}
                {item.meta.includes('40') && <span className="text-amber-600">40-60%</span>}
                <span className="text-red-600">&lt;{item.meta.includes('30') ? '30' : '40'}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Chart + Detail ─── */}
      <div className="grid gap-5 md:grid-cols-5">
        {/* Bar chart */}
        <div className="md:col-span-2 card p-5">
          <div className="section-header mb-4">
            <div className="section-header-bar" />
            <h3 className="section-title">Cumplimiento por indicador</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(value, _, props) => [
                  `${value.toFixed(1)}% (${props.payload.numerador}/${props.payload.denominador})`,
                  props.payload.fullName,
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {chartData.map((entry) => {
                  const level = getLevel(entry.value, entry.meta)
                  const fillMap = { bueno: '#22C55E', aceptable: '#F59E0B', critico: '#EF4444', neutral: '#94A3B8' }
                  return <Cell key={entry.fullName} fill={fillMap[level]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-[0.5rem] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Bueno</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Aceptable</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Crítico</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="md:col-span-3 card p-5">
          <div className="section-header mb-4">
            <div className="section-header-bar" />
            <h3 className="section-title">Resumen de evaluación</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.indicators.map((ind) => {
              const level = getLevel(String(ind.CUMPLIMIENTO).replace('%', ''), ind.META)
              const badgeMap = {
                bueno: 'bg-green-100 text-green-700 border-green-200',
                aceptable: 'bg-amber-100 text-amber-700 border-amber-200',
                critico: 'bg-red-100 text-red-700 border-red-200',
                neutral: 'bg-gray-100 text-gray-700 border-gray-200',
              }
              return (
                <div key={ind.INDICADOR} className="rounded-lg border border-ink-line/60 bg-surface-50/70 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted leading-tight">
                      {ind.INDICADOR}
                    </span>
                    <span className={`text-[0.45rem] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border ${badgeMap[level]}`}>
                      {level === 'bueno' ? 'Meta' : level === 'aceptable' ? 'Alerta' : 'Crítico'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-lg font-extrabold ${
                      level === 'bueno' ? 'text-green-600' : level === 'aceptable' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {ind.CUMPLIMIENTO}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {ind.NUMERADOR}/{ind.DENOMINADOR}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Patient table ─── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="section-header">
            <div className="section-header-bar" />
            <h3 className="section-title">Pacientes evaluados</h3>
            <span className="badge-gray">{filteredPatients.length} pacientes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.5rem] font-semibold text-ink-muted uppercase tracking-wider">Filtrar por:</span>
            <select value={filterIndicator} onChange={(e) => setFilterIndicator(e.target.value)}
              className="select text-xs py-1.5 px-2 w-auto">
              <option value="all">Todos</option>
              {data.indicators.map((ind) => (
                <option key={ind.INDICADOR} value={ind.INDICADOR}>{ind.INDICADOR}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-ink-line/60 bg-white scroll-thin max-h-[500px]">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-50 border-b border-ink-line">
                <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wider text-ink-muted">#</th>
                <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wider text-ink-muted">Id</th>
                {data.eval_columns.filter((c) => c !== '_POBLACION_HTA' && c !== '_POBLACION_DM').map((col) => (
                  <th key={col} className="px-3 py-2.5 text-center font-bold uppercase tracking-wider text-ink-muted">
                    {col.replace('_', ' ').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPatients.slice(0, 200).map((p) => (
                <tr key={p._index} className="border-b border-surface-100 hover:bg-brand-50/20 transition-colors">
                  <td className="px-3 py-2 font-semibold text-ink-muted">{p._index}</td>
                  <td className="px-3 py-2 font-mono text-ink">{p['NUMERO DE IDENTIFICACIÓN'] || p._index}</td>
                  {totalEvalCols.map((col) => {
                    const val = p[col]
                    const isSi = val === 'SI'
                    return (
                      <td key={col} className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 text-[0.45rem] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                          isSi ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSi ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {val}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPatients.length > 200 && (
            <div className="p-3 text-center text-xs text-ink-muted border-t border-ink-line/60 bg-surface-50/70">
              Mostrando 200 de {filteredPatients.length} pacientes
            </div>
          )}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-sm text-ink-muted">
              No hay pacientes que cumplan este filtro.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
