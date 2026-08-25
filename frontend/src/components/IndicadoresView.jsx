import React, { useState, useCallback, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { fetchIndicadores, fetchCargues, fetchIndicadoresDeCargue, descargarIndicadoresExcel } from '../api'
import { leerUltimaData } from '../dataStore'

const AZUL = '#2C4A6F'
const AZUL_MEDIO = '#4A6FA5'
const AZUL_CLARO = '#E6F0FA'
const COLORS = ['#2C4A6F', '#4A6FA5', '#6B8FBF', '#8FA9D1', '#5A87B5', '#7FA8D9', '#A3C2E8', '#3E5C85', '#6E8FB8', '#91B3D8']

function formatResult(v) {
  if (v === null || v === undefined) return '#DIV/0!'
  const s = String(Math.round(v * 100) / 100).replace('.', ',')
  return s
}

function estadoResultado(v) {
  if (v === null) return { color: '#DC2626', bg: '#FEE2E2', label: 'Sin dato' }
  if (v >= 95) return { color: '#15803D', bg: '#DCFCE7', label: 'Cumplido' }
  if (v >= 80) return { color: '#B45309', bg: '#FEF3C7', label: 'En mejora' }
  return { color: '#B91C1C', bg: '#FEE2E2', label: 'Critico' }
}

// ─── KPI Card estilo dashboard ───
function KpiCard({ label, value, sub, icon, gradiente }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{
      background: gradiente || `linear-gradient(145deg, #1E3A5F 0%, #2C4A6F 55%, #4A6FA5 100%)`,
      boxShadow: '0 8px 24px rgba(44,74,111,0.25)',
    }}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: '#fff' }} />
      <div className="absolute right-6 bottom-2 opacity-10" style={{ color: '#fff' }}>{icon}</div>
      <div className="text-[0.62rem] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div className="text-[0.68rem] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{sub}</div>}
    </div>
  )
}

// ─── Resumen de semaforo ───
function ResumenSemaforo({ lista }) {
  if (!lista || !lista.length) return null
  let verdes = 0, ambar = 0, rojos = 0, sinDato = 0
  lista.forEach((ind) => {
    const r = ind.resultado
    if (r === null) sinDato += 1
    else if (r >= 95) verdes += 1
    else if (r >= 80) ambar += 1
    else rojos += 1
  })
  const items = [
    { label: 'Cumplidos', n: verdes, color: '#15803D', bg: '#DCFCE7' },
    { label: 'En mejora', n: ambar, color: '#B45309', bg: '#FEF3C7' },
    { label: 'Criticos', n: rojos, color: '#B91C1C', bg: '#FEE2E2' },
    { label: 'Sin dato', n: sinDato, color: '#6B7280', bg: '#F3F4F6' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: it.bg }}>
          <div>
            <div className="text-[0.62rem] font-medium uppercase tracking-wider" style={{ color: it.color }}>{it.label}</div>
            <div className="text-xl font-bold mt-0.5" style={{ color: it.color }}>{it.n}</div>
          </div>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: it.color }} />
        </div>
      ))}
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

// ─── Tabla de indicadores ───
function PareTable({ lista, titulo, subTitulo }) {
  if (!lista || !lista.length) return null
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo || 'Cohorte de Gestantes PARE MM'}</div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subTitulo || ''}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="text-center" style={{ width: 70 }}>Num (a)</th>
              <th className="text-center" style={{ width: 70 }}>Den (b)</th>
              <th style={{ width: 200 }}>Cumplimiento</th>
              <th className="text-center" style={{ width: 80 }}>Resultado</th>
              <th className="text-center" style={{ width: 90 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((ind, i) => {
              const r = ind.resultado
              const pctBar = r === null ? 0 : Math.min(r, 100)
              const est = estadoResultado(r)
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
                        <div className="h-full rounded-full" style={{ width: pctBar + '%', background: est.color }} />
                      </div>
                      <span className="text-[0.62rem] font-medium" style={{ color: 'var(--text-secondary)' }}>{pctBar.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: est.color, backgroundColor: est.bg }}>{formatResult(r)}%</span>
                  </td>
                  <td className="text-center">
                    <span className="inline-block text-[0.62rem] font-medium px-2 py-0.5 rounded-md" style={{ color: est.color, backgroundColor: est.bg }}>{est.label}</span>
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

// ─── Grafico de barras del resultado ───
function ResultadoChart({ lista }) {
  if (!lista || !lista.length) return null
  const data = lista.map((ind) => ({
    name: ind.label.length > 50 ? ind.label.slice(0, 50) + '...' : ind.label,
    resultado: ind.resultado === null ? 0 : Math.round(ind.resultado * 10) / 10,
    fill: estadoResultado(ind.resultado).color,
  }))
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Resultado de los indicadores (%)</div>
      <div style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 45, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={270} tick={{ fontSize: 9 }} />
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

  useEffect(() => { if (templateKey) setSelectedTemplate(templateKey) }, [templateKey])

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
      } finally { if (mounted) setCarguesLoaded(true) }
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
      if (id) { try { result = await fetchIndicadoresDeCargue(id) } catch (e) { result = null } }
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
      if (!result) { setError(`No se encontro data valida (cargues disponibles: ${carguesRef.current.length}). Valida una data primero.`); setLoading(false); return }
      setIndicadores(result)
      setLoaded(true)
    } catch (e) { setError('Error al generar indicadores: ' + (e.message || 'Error desconocido')) }
    finally { setLoading(false) }
  }, [selectedTemplate])

  handleGenerateRef.current = handleGenerate

  const handleExport = useCallback(async () => {
    setExporting(true); setError('')
    try {
      const id = cargueIdRef.current || (carguesRef.current.length ? carguesRef.current[0].id : '')
      if (!id) throw new Error('Selecciona una data validada primero.')
      const fecha = new Date().toISOString().slice(0, 10)
      await descargarIndicadoresExcel(id, `indicadores_pare_mm_${fecha}.xlsx`)
    } catch (e) { setError('Error al descargar Excel: ' + (e.message || 'error')) }
    finally { setExporting(false) }
  }, [])

  useEffect(() => {
    if (dataValidada && typeof dataValidada === 'string' && dataValidada.trim()) handleGenerateRef.current()
  }, [dataValidada, selectedTemplate])

  const templateOptions = [
    { key: 'gestante', label: 'Gestante' }, { key: 'citologia', label: 'Citologia' }, { key: 'mamografia', label: 'Mamografia' }, { key: 'penta', label: 'Penta' },
  ]

  const pare = indicadores?.indicadores?.pare_mm
  const descriptivos = indicadores?.indicadores?.descriptivos
  const porMunicipio = pare?.por_municipio || []
  const listaDept = pare?.lista || []

  return (
    <div className="space-y-6 fade-in">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C4A6F 50%, #4A6FA5 100%)', boxShadow: '0 8px 32px rgba(44,74,111,0.30)' }}>
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="relative p-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.02em' }}>Indicadores PARE MM</h1>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Cohorte de gestantes - nivel departamental y municipal</p>
          </div>
          {loaded && (
            <button onClick={handleExport} disabled={exporting || loading} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {exporting ? 'Descargando...' : 'Descargar Excel'}
            </button>
          )}
        </div>
      </div>

      {/* Selector */}
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
              {cargues.map((c) => <option key={c.id} value={String(c.id)}>{c.original_filename} - {c.row_count} registros - {c.quality_percent}% calidad</option>)}
            </select>
          </div>
        )}
        <button onClick={handleGenerate} disabled={loading} className="btn-primary">{loading ? 'Generando...' : 'Generar indicadores'}</button>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      {loaded && indicadores && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total gestantes" value={pare?.total_gestantes ?? indicadores.total_registros} sub="Cohorte completa" icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" /></svg>} />
            <KpiCard label="Municipios" value={porMunicipio.length} sub="Con data cargada" gradiente="linear-gradient(145deg,#1E3A5F 0%,#2C4A6F 55%,#4A6FA5 100%)" icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6a2 2 0 012 2v12m-10 0h10m0 0V9a2 2 0 012-2h4a2 2 0 012 2v10" /></svg>} />
            <KpiCard label="Registros validados" value={indicadores.total_registros} sub="Al 100% calidad" gradiente="linear-gradient(145deg,#153A5F 0%,#1E4A7A 55%,#4A8FC5 100%)" icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
            <KpiCard label="Fecha referencia" value={pare?.fecha_referencia ?? '—'} sub="Corte de los datos" gradiente="linear-gradient(145deg,#0F2E4E 0%,#16395F 55%,#2C6EA8 100%)" icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
          </div>

          {/* Resumen semaforo */}
          <ResumenSemaforo lista={listaDept} />

          {/* Toggle nivel */}
          <div className="flex gap-2">
            <button onClick={() => setVerPorMunicipio(false)} className={!verPorMunicipio ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>Nivel Departamental</button>
            <button onClick={() => setVerPorMunicipio(true)} className={verPorMunicipio ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>Nivel Municipal</button>
          </div>

          {!verPorMunicipio ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3"><ResultadoChart lista={listaDept} /></div>
                <div className="xl:col-span-2 flex flex-col gap-4">
                  {descriptivos && Object.entries(descriptivos.data || {}).slice(0, 2).map(([key, data]) => (<ChartCard key={key} title={key} data={data} isPie={Object.keys(data).length <= 4} height={200} />))}
                </div>
              </div>
              <PareTable lista={listaDept} titulo="Cohorte de Gestantes PARE MM" subTitulo={`Nivel Departamental - ${pare?.fecha_referencia}`} />
            </>
          ) : (
            <div className="space-y-6">
              {porMunicipio.map((m) => (<PareTable key={m.codigo || m.municipio} lista={m.indicadores} titulo={m.municipio} subTitulo={`Nivel MUNICIPAL - ${m.total} gestantes`} />))}
            </div>
          )}

          {!verPorMunicipio && descriptivos && Object.keys(descriptivos.data || {}).length > 2 && (
            <div>
              <div className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Distribucion de la cohorte</div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Object.entries(descriptivos.data).slice(2).map(([key, data]) => (<ChartCard key={key} title={key} data={data} isPie={Object.keys(data).length <= 4} />))}
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