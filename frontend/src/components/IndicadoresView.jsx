import React, { useState, useCallback, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { fetchIndicadores, fetchCargues, setupGestantes } from '../api'
import { leerUltimaData } from '../dataStore'
import { useAuth } from '../AuthContext'

const COLORS = ['#3A863A', '#6BC06B', '#4A9A4A', '#5AAE5A', '#22C55E', '#86EFAC', '#16A34A', '#15803D', '#166534', '#14532D', '#A7F3D0', '#BBF7D0']

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border-subtle)' }}>
      <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function formatResult(v) {
  if (v === null || v === undefined) return '#DIV/0!'
  return String(v).replace('.', ',')
}

function PareTable({ pare, titulo, subTitulo, soloIndicadores }) {
  const lista = soloIndicadores || pare?.lista || []
  if (!lista.length) return null
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{titulo || 'Cohorte de Gestantes PARE MM'}</div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subTitulo || 'Nivel Departamental'}</span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="text-center">Numerador (a)</th>
              <th className="text-center">Denominador (b)</th>
              <th className="text-center">Coeficiente</th>
              <th className="text-center">Resultado (a/b*100)</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((ind, i) => (
              <tr key={i}>
                <td>
                  <div className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>{ind.label}</div>
                  {ind.variable && <div className="text-[0.6rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ind.variable}</div>}
                </td>
                <td className="text-center font-medium">{ind.numerador}</td>
                <td className="text-center">{ind.denominador}</td>
                <td className="text-center">{ind.coeficiente}%</td>
                <td className="text-center">
                  <span className={ind.resultado === null ? 'badge-error' : 'badge-success'}>{formatResult(ind.resultado)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PorMunicipioView({ porMunicipio }) {
  if (!porMunicipio || !porMunicipio.length) return null
  return (
    <div className="space-y-6">
      <div>
        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Indicadores por municipio</div>
        <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Desglose de la cohorte a nivel municipal.</div>
      </div>
      {porMunicipio.map((m) => (
        <PareTable
          key={m.codigo || m.municipio}
          titulo={m.municipio}
          subTitulo={`Nivel MUNICIPAL - ${m.total} gestantes`}
          soloIndicadores={m.indicadores}
        />
      ))}
    </div>
  )
}

function ChartCard({ title, data, isPie }) {
  // Normalizar datos para que recharts no falle con valores raros.
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name: String(name),
    value: Number(value) || 0,
  }))
  if (chartData.length === 0) return null

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border-subtle)' }}>
      <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          {isPie ? (
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Registros']} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Registros']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function IndicadoresView({ templateKey = 'gestante', dataValidada = '', templateNames = [] }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [indicadores, setIndicadores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(templateKey || 'gestante')
  const [loaded, setLoaded] = useState(false)
  const [verPorMunicipio, setVerPorMunicipio] = useState(false)
  const [cargues, setCargues] = useState([])
  const [cargueId, setCargueId] = useState('')
  const [carguesLoaded, setCarguesLoaded] = useState(false)
  const [setupState, setSetupState] = useState('')

  const handleSetupTabla = useCallback(async () => {
    setSetupState('creando'); setError('')
    try {
      const r = await setupGestantes()
      setSetupState(`ok:${r.columnas}`)
      // Recargar cargues
      try {
        const list = await fetchCargues(selectedTemplate)
        setCargues(list)
        if (list.length && !cargueId) setCargueId(String(list[0].id))
      } catch (e) { /* ignore */ }
    } catch (e) {
      setError('No se pudo crear la tabla: ' + (e.message || 'error'))
      setSetupState('error')
    }
  }, [selectedTemplate, cargueId])

  // Sincronizar la plantilla seleccionada con la plantilla activa del layout.
  useEffect(() => {
    if (templateKey) setSelectedTemplate(templateKey)
  }, [templateKey])

  // Cargar la lista de cargues validados desde la BD.
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const list = await fetchCargues(selectedTemplate)
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

  // Obtener el texto pipe-delimited de un cargue por su id.
  const obtenerTextoDeCargue = useCallback(async (id) => {
    const resp = await fetch(`${window.location.origin}/api/cargues/${id}`, {
      headers: { Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('auth') || '{}').token}` },
    })
    const data = await resp.json()
    let t = data.corrected_text || data.raw_text || ''
    if (data.compressed && t) {
      try {
        const pako = await import('pako')
        const bin = atob(t)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
        t = pako.ungzip(bytes, { to: 'string' })
      } catch (e) { /* usar como esta */ }
    }
    return t
  }, [])

  const handleGenerateRef = useRef(null)
  const dataValidadaRef = useRef(dataValidada)
  dataValidadaRef.current = dataValidada
  const cargueIdRef = useRef(cargueId)
  cargueIdRef.current = cargueId
  const carguesRef = useRef(cargues)
  carguesRef.current = cargues

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(''); setIndicadores(null); setVerPorMunicipio(false)
    try {
      let text = ''
      let source = ''

      // 1. Si hay un cargue seleccionado (de la BD), usar su data.
      if (cargueIdRef.current) {
        try {
          text = await obtenerTextoDeCargue(cargueIdRef.current)
          if (text && text.trim()) source = 'bd-cargue'
        } catch (e) { text = '' }
      }

      // 2. Si no, usar la data validada pasada directamente desde App.jsx.
      if (!text && dataValidadaRef.current && typeof dataValidadaRef.current === 'string' && dataValidadaRef.current.trim()) {
        text = dataValidadaRef.current
        source = 'prop'
      }

      // 3. Si no, intentar el store global / storage.
      if (!text) {
        try {
          let stored = null
          try { stored = leerUltimaData() } catch (e) {}
          if (!stored) { try { stored = JSON.parse(window.__ultimaDataValidada || 'null') } catch (e) {} }
          if (!stored) { try { stored = JSON.parse(sessionStorage.getItem('ultima_data_validada') || 'null') } catch (e) {} }
          if (!stored) { try { stored = JSON.parse(localStorage.getItem('ultima_data_validada') || 'null') } catch (e) {} }
          if (stored && (stored.template_key === selectedTemplate || !stored.template_key)) {
            let storedText = stored.corrected_text || stored.raw_text || ''
            if (storedText) {
              if (stored.compressed && typeof storedText === 'string' && /^[A-Za-z0-9+/=]+$/.test(storedText)) {
                try {
                  const pako = await import('pako')
                  const bin = atob(storedText)
                  const bytes = new Uint8Array(bin.length)
                  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
                  text = pako.ungzip(bytes, { to: 'string' })
                } catch (e) { text = storedText }
              } else {
                text = typeof storedText === 'string' ? storedText : String(storedText || '')
              }
              source = 'session'
            }
          }
        } catch (e) { /* ignore */ }
      }

      // 4. Si no hay texto pero hay cargues en la BD, usar el mas reciente.
      if (!text && carguesRef.current.length) {
        try {
          text = await obtenerTextoDeCargue(carguesRef.current[0].id)
          if (text && text.trim()) source = 'bd'
        } catch (e) { text = '' }
      }

      if (!text || typeof text !== 'string' || !text.trim()) {
        const nCargues = carguesRef.current ? carguesRef.current.length : 0
        setError(`No se encontro data valida (cargues disponibles: ${nCargues}). Valida una data primero o selecciona un cargue.` + (source ? ` Fuente: ${source}` : ''))
        setLoading(false)
        return
      }

      const payload = String(text).trim()
      const result = await fetchIndicadores(selectedTemplate, payload)
      setIndicadores(result)
      setLoaded(true)
    } catch (e) {
      setError('Error al generar indicadores: ' + (e.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate, obtenerTextoDeCargue])

  handleGenerateRef.current = handleGenerate

  // Cargar automaticamente cuando llega data nueva.
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

  return (
    <div className="space-y-6 fade-in">
      <div>
        <div className="page-title">Indicadores</div>
        <div className="page-subtitle">Cohorte de gestantes PARE MM - nivel departamental y municipal.</div>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Plantilla</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="input" style={{ minWidth: 180 }}>
            {templateOptions.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        {cargues.length > 0 && (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Data validada (cargue)</label>
            <select value={cargueId} onChange={(e) => setCargueId(e.target.value)} className="input" style={{ minWidth: 220 }}>
              {cargues.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.original_filename} - {c.row_count} reg - {c.quality_percent}% calidad
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Generando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Generar indicadores
            </span>
          )}
        </button>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      {loaded && indicadores && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total gestantes" value={pare?.total_gestantes ?? indicadores.total_registros} color="#3A863A" />
            <StatCard label="Municipios" value={porMunicipio.length} color="#4A9A4A" />
            <StatCard label="Fecha referencia" value={pare?.fecha_referencia ?? '—'} />
          </div>

          {porMunicipio.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => setVerPorMunicipio(false)} className={!verPorMunicipio ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
                Nivel Departamental
              </button>
              <button onClick={() => setVerPorMunicipio(true)} className={verPorMunicipio ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
                Nivel Municipal
              </button>
            </div>
          )}

          {verPorMunicipio ? (
            <PorMunicipioView porMunicipio={porMunicipio} />
          ) : (
            pare && <PareTable pare={pare} titulo="Cohorte de Gestantes PARE MM" subTitulo={`Nivel Departamental - ${pare.fecha_referencia}`} />
          )}

          {!verPorMunicipio && descriptivos && Object.entries(descriptivos.data || {}).length > 0 && (
            <div>
              <div className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Distribucion de la cohorte</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(descriptivos.data).map(([key, data]) => (
                  <ChartCard key={key} title={key} data={data} isPie={Object.keys(data).length <= 4} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loaded && !loading && (
        <div className="space-y-4">
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div className="empty-title">Genera los indicadores de la cohorte</div>
            <div className="empty-desc">Se mostraran los indicadores PARE MM a nivel departamental y municipal.</div>
          </div>
          {carguesLoaded && cargues.length === 0 && !dataValidada && (
            <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>
              No hay cargues guardados para esta plantilla. Valida una data primero (se guardara automaticamente en el historial) y luego genera los indicadores.
            </div>
          )}

          {isAdmin && (
            <div className="panel flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Configuracion de la base de datos</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Crea la tabla de gestantes en PostgreSQL (esquema public) con los 207 encabezados del modulo.
                  {setupState === 'ok' && <span style={{ color: 'var(--success)' }}> Tabla creada correctamente.</span>}
                </div>
              </div>
              <button onClick={handleSetupTabla} disabled={setupState === 'creando'} className="btn-primary text-sm">
                {setupState === 'creando' ? 'Creando...' : 'Crear tabla de gestantes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}