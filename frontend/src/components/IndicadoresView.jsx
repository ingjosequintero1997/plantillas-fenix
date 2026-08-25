import React, { useState, useCallback, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { fetchIndicadores, fetchCargues, fetchIndicadoresDeCargue, descargarIndicadoresExcel } from '../api'
import { leerUltimaData } from '../dataStore'

const VERDE = '#3A863A'
const VERDE_MEDIO = '#5AAE5A'
const VERDE_CLARO = '#6BC06B'
const COLORS = ['#3A863A', '#6BC06B', '#4A9A4A', '#5AAE5A', '#22C55E', '#86EFAC', '#16A34A', '#15803D', '#166534', '#14532D', '#A7F3D0', '#BBF7D0']

function formatResult(v) {
  if (v === null || v === undefined) return '#DIV/0!'
  const s = String(Math.round(v * 100) / 100).replace('.', ',')
  return s
}

function colorResultado(v) {
  if (v === null) return '#DC2626'
  if (v >= 95) return '#15803D'
  if (v >= 80) return '#B45309'
  return '#B91C1C'
}

function fondoResultado(v) {
  if (v === null) return '#FEE2E2'
  if (v >= 95) return '#DCFCE7'
  if (v >= 80) return '#FEF3C7'
  return '#FEE2E2'
}

// ─── KPI Card estilo dashboard ───
function KpiCard({ label, value, sub, icon, gradiente }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{
      background: gradiente || `linear-gradient(145deg, #2E7D32 0%, #4A9A4A 55%, #6BC06B 100%)`,
      boxShadow: '0 8px 24px rgba(58,134,58,0.25)',
    }}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: '#fff' }} />
      <div className="absolute right-8 bottom-2 opacity-10" style={{ color: '#fff' }}>
        {icon}
      </div>
      <div className="text-[0.62rem] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div className="text-[0.68rem] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{sub}</div>}
    </div>
  )
}

// ─── Tarjeta de grafico ───
function ChartCard({ title, data, isPie, height }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name: String(name),
    value: Number(value) || 0,
  }))
  if (chartData.length === 0) return null
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ height: height || 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          {isPie ? (
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Registros']} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [v, 'Registros']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Tabla de indicadores con barras de progreso ───
function PareTable({ lista, titulo, subTitulo }) {
  if (!lista || !lista.length) return null
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo || 'Cohorte de Gestantes PARE MM'}</div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subTitulo || ''}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="text-center" style={{ width: 90 }}>Num (a)</th>
              <th className="text-center" style={{ width: 90 }}>Den (b)</th>
              <th style={{ width: 220 }}>Cumplimiento</th>
              <th className="text-center" style={{ width: 90 }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((ind, i) => {
              const r = ind.resultado
              const pctBar = r === null ? 0 : Math.min(r, 100)
              return (
                <tr key={i}>
                  <td>
                    <div className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{ind.label}</div>
                    {ind.variable && <div className="text-[0.62rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ind.variable}</div>}
                  </td>
                  <td className="text-center text-sm font-semibold">{ind.numerador}</td>
                  <td className="text-center text-sm">{ind.denominador}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-subtle)' }}>
                        <div className="h-full rounded-full" style={{
                          width: pctBar + '%',
                          background: r === null ? '#DC2626' : r >= 95 ? 'linear-gradient(90deg,#16A34A,#22C55E)' : r >= 80 ? 'linear-gradient(90deg,#D97706,#F59E0B)' : 'linear-gradient(90deg,#DC2626,#EF4444)',
                        }} />
                      </div>
                      <span className="text-[0.62rem] font-medium" style={{ color: 'var(--text-secondary)' }}>{pctBar.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: colorResultado(r), backgroundColor: fondoResultado(r) }}>
                      {formatResult(r)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Grafico de barras del resultado de indicadores (nivel departamental) ───
function ResultadoChart({ lista }) {
  if (!lista || !lista.length) return null
  const data = lista.map((ind, i) => ({
    name: ind.label.length > 55 ? ind.label.slice(0, 55) + '...' : ind.label,
    resultado: ind.resultado === null ? 0 : Math.round(ind.resultado * 10) / 10,
    fill: colorResultado(ind.resultado),
  }))
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Resultado de los indicadores (%)</div>
      <div style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 45, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={260} tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v) => [v + '%', 'Resultado']} />
            <Bar dataKey="resultado" radius={[0, 4, 4, 0]} barSize={16} label={{ position: 'right', fontSize: 9, fill: '#666' }}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function IndicadoresView({ templateKey = 'gestante', dataValidada = '', templateNames = [] }) {
  const [indicadores, setIndicadores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(templateKey || 'gestante')
  const [loaded, setLoaded] = useState(false)
  const [verPorMunicipio, setVerPorMunicipio] = useState(false)
  const [cargues, setCargues] = useState([])
  const [cargueId, setCargueId] = useState('')
  const [carguesLoaded, setCarguesLoaded] = useState(false)

  // Sincronizar la plantilla seleccionada con la plantilla activa del layout.
  useEffect(() => {
    if (templateKey) setSelectedTemplate(templateKey)
  }, [templateKey])

  // Cargar la lista de cargues validados desde la BD.
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        let list = await fetchCargues(selectedTemplate)
        if (!list.length) {
          const todos = await fetchCargues('')
          list = todos.filter((c) => !c.template_key || c.template_key === selectedTemplate)
          if (!list.length) list = todos
        }
        if (!mounted) return
        setCargues(list)
        if (list.length && !cargueId) setCargueId(String(list[0].id))
      } catch (e) {
        if (mounted) setError('No se pudo cargar el historial de cargues: ' + (e.message || 'error'))
      } finally {
        if (mounted) setCarguesLoaded(true)
      }
    }
    load()
    return () => { mounted = false }
  }, [selectedTemplate]) // eslint-disable-line react-hooks/exhaustive-deps

  const cargueIdRef = useRef(cargueId)
  cargueIdRef.current = cargueId
  const carguesRef = useRef(cargues)
  carguesRef.current = cargues
  const dataValidadaRef = useRef(dataValidada)
  dataValidadaRef.current = dataValidada
  const handleGenerateRef = useRef(null)

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(''); setIndicadores(null); setVerPorMunicipio(false)
    try {
      let result = null
      const id = cargueIdRef.current || (carguesRef.current.length ? carguesRef.current[0].id : '')
      if (id) {
        try { result = await fetchIndicadoresDeCargue(id) } catch (e) { result = null }
      }
      if (!result && dataValidadaRef.current && typeof dataValidadaRef.current === 'string' && dataValidadaRef.current.trim()) {
        try { result = await fetchIndicadores(selectedTemplate, String(dataValidadaRef.current).trim()) } catch (e) { result = null }
      }
      if (!result) {
        try {
          let stored = null
          try { stored = leerUltimaData() } catch (e) {}
          if (!stored) { try { stored = JSON.parse(window.__ultimaDataValidada || 'null') } catch (e) {} }
          if (!stored) { try { stored = JSON.parse(sessionStorage.getItem('ultima_data_validada') || 'null') } catch (e) {} }
          if (!stored) { try { stored = JSON.parse(localStorage.getItem('ultima_data_validada') || 'null') } catch (e) {} }
          if (stored) {
            let st = stored.corrected_text || stored.raw_text || ''
            if (stored.compressed && /^[A-Za-z0-9+/=]+$/.test(st)) {
              const pako = await import('pako')
              const bin = atob(st)
              const bytes = new Uint8Array(bin.length)
              for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
              st = pako.ungzip(bytes, { to: 'string' })
            }
            if (st && st.trim()) result = await fetchIndicadores(selectedTemplate, String(st).trim())
          }
        } catch (e) { /* ignore */ }
      }
      if (!result) {
        setError(`No se encontro data valida (cargues disponibles: ${carguesRef.current.length}). Valida una data primero.`)
        setLoading(false)
        return
      }
      setIndicadores(result)
      setLoaded(true)
    } catch (e) {
      setError('Error al generar indicadores: ' + (e.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate])

  handleGenerateRef.current = handleGenerate

  const handleExport = useCallback(async () => {
    setExporting(true); setError('')
    try {
      const id = cargueIdRef.current || (carguesRef.current.length ? carguesRef.current[0].id : '')
      if (!id) throw new Error('Selecciona una data validada primero.')
      const fecha = new Date().toISOString().slice(0, 10)
      await descargarIndicadoresExcel(id, `indicadores_pare_mm_${fecha}.xlsx`)
    } catch (e) {
      setError('Error al descargar Excel: ' + (e.message || 'error'))
    } finally {
      setExporting(false)
    }
  }, [])

  // Cargar automaticamente si llega data nueva.
  useEffect(() => {
    if (dataValidada && typeof dataValidada === 'string' && dataValidada.trim()) {
      handleGenerateRef.current()
    }
  }, [dataValidada, selectedTemplate])

  const templateOptions = [
    { key: 'gestante', label: 'Gestante' },
    { key: 'citologia', label: 'Citologia' },
    { key: 'mamografia', label: 'Mamografia' },
    { key: 'penta', label: 'Penta' },
  ]

  const pare = indicadores?.indicadores?.pare_mm
  const descriptivos = indicadores?.indicadores?.descriptivos
  const porMunicipio = pare?.por_municipio || []
  const listaDept = pare?.lista || []

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="page-title">Indicadores PARE MM</div>
          <div className="page-subtitle">Cohorte de gestantes - nivel departamental y municipal.</div>
        </div>
        {loaded && (
          <button onClick={handleExport} disabled={exporting || loading} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {exporting ? 'Descargando...' : 'Descargar Excel'}
          </button>
        )}
      </div>

      {/* Selector de cargues */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Plantilla</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="input" style={{ minWidth: 160 }}>
            {templateOptions.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        {cargues.length > 0 && (
          <div className="flex-1">
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Data validada (cargue)</label>
            <select value={cargueId} onChange={(e) => setCargueId(e.target.value)} className="input" style={{ minWidth: 280, width: '100%' }}>
              {cargues.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.original_filename} - {c.row_count} registros - {c.quality_percent}% calidad
                </option>
              ))}
            </select>
          </div>
        )}
        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          {loading ? 'Generando...' : 'Generar indicadores'}
        </button>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      {loaded && indicadores && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total gestantes"
              value={pare?.total_gestantes ?? indicadores.total_registros}
              sub="Cohorte completa"
              icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" /></svg>}
            />
            <KpiCard
              label="Municipios"
              value={porMunicipio.length}
              sub="Con data cargada"
              gradiente="linear-gradient(145deg,#166534 0%,#15803D 55%,#22C55E 100%)"
              icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6a2 2 0 012 2v12m-10 0h10m0 0V9a2 2 0 012-2h4a2 2 0 012 2v10" /></svg>}
            />
            <KpiCard
              label="Registros validados"
              value={indicadores.total_registros}
              sub="Al 100% calidad"
              gradiente="linear-gradient(145deg,#14532D 0%,#166534 55%,#4ADE80 100%)"
              icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <KpiCard
              label="Fecha referencia"
              value={pare?.fecha_referencia ?? '—'}
              sub="Corte de los datos"
              gradiente="linear-gradient(145deg,#065F46 0%,#059669 55%,#34D399 100%)"
              icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
          </div>

          {/* Toggle nivel */}
          <div className="flex gap-2">
            <button onClick={() => setVerPorMunicipio(false)} className={!verPorMunicipio ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>Nivel Departamental</button>
            <button onClick={() => setVerPorMunicipio(true)} className={verPorMunicipio ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>Nivel Municipal</button>
          </div>

          {!verPorMunicipio ? (
            <>
              {/* Grafico de resultados + tabla departamental */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3">
                  <ResultadoChart lista={listaDept} />
                </div>
                <div className="xl:col-span-2 flex flex-col gap-4">
                  {descriptivos && Object.entries(descriptivos.data || {}).slice(0, 2).map(([key, data]) => (
                    <ChartCard key={key} title={key} data={data} isPie={Object.keys(data).length <= 4} height={200} />
                  ))}
                </div>
              </div>
              {/* Tabla completa departamental */}
              <PareTable lista={listaDept} titulo="Cohorte de Gestantes PARE MM" subTitulo={`Nivel Departamental - ${pare?.fecha_referencia}`} />
            </>
          ) : (
            <div className="space-y-6">
              {porMunicipio.map((m) => (
                <PareTable key={m.codigo || m.municipio} lista={m.indicadores} titulo={m.municipio} subTitulo={`Nivel MUNICIPAL - ${m.total} gestantes`} />
              ))}
            </div>
          )}

          {/* Descriptivos restantes */}
          {!verPorMunicipio && descriptivos && Object.keys(descriptivos.data || {}).length > 2 && (
            <div>
              <div className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Distribucion de la cohorte</div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Object.entries(descriptivos.data).slice(2).map(([key, data]) => (
                  <ChartCard key={key} title={key} data={data} isPie={Object.keys(data).length <= 4} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loaded && !loading && (
        <div className="empty">
          <div className="empty-icon"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
          <div className="empty-title">Selecciona una data validada</div>
          <div className="empty-desc">Elige un cargue en el selector y presiona Generar indicadores.</div>
        </div>
      )}
    </div>
  )
}