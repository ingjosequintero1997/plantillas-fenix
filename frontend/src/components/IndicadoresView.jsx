import React, { useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { fetchIndicadores, fetchCargues } from '../api'

const COLORS = ['#3A863A', '#6BC06B', '#4A9A4A', '#5AAE5A', '#22C55E', '#86EFAC', '#16A34A', '#15803D', '#166534', '#14532D', '#A7F3D0', '#BBF7D0']

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border-subtle)' }}>
      <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function ChartCard({ title, data, dataKey, nameKey, isPie }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }))
  if (chartData.length === 0) return null

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border-subtle)' }}>
      <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          {isPie ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
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

export default function IndicadoresView({ templateKey = 'gestante' }) {
  const [indicadores, setIndicadores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(templateKey)
  const [loaded, setLoaded] = useState(false)

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(''); setIndicadores(null)
    try {
      const cargues = await fetchCargues(selectedTemplate)
      if (!cargues.length) {
        setError('No hay cargues para esta plantilla. Sube data primero.')
        setLoading(false)
        return
      }
      const latest = cargues[0]
      const resp = await fetch(`${window.location.origin}/api/cargues/${latest.id}`, {
        headers: { Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('auth') || '{}').token}` },
      })
      const data = await resp.json()
      let text = data.corrected_text || ''
      if (data.compressed && text) {
        try {
          const pako = await import('pako')
          const bin = atob(text)
          const bytes = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
          text = pako.ungzip(bytes, { to: 'string' })
        } catch { /* ignore */ }
      }
      const result = await fetchIndicadores(selectedTemplate, text)
      setIndicadores(result)
      setLoaded(true)
    } catch (e) {
      setError('Error al generar indicadores: ' + (e.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate])

  const templateOptions = [
    { key: 'gestante', label: 'Gestante' },
    { key: 'citologia', label: 'Citologia' },
    { key: 'mamografia', label: 'Mamografia' },
    { key: 'penta', label: 'Penta' },
  ]

  return (
    <div className="space-y-6 fade-in">
      <div>
        <div className="page-title">Indicadores</div>
        <div className="page-subtitle">Analisis estadistico y graficos de los datos cargados.</div>
      </div>

      {/* Selector de plantilla y boton generar */}
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Plantilla</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="input" style={{ minWidth: 180 }}>
            {templateOptions.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total registros" value={indicadores.total_registros} color="#3A863A" />
            <StatCard label="Plantilla" value={indicadores.template_key} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(indicadores.indicadores || {}).map(([key, ind]) => (
              <ChartCard
                key={key}
                title={ind.label}
                data={ind.data}
                isPie={Object.keys(ind.data).length <= 5}
              />
            ))}
          </div>
        </>
      )}

      {!loaded && !loading && (
        <div className="empty">
          <div className="empty-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div className="empty-title">Selecciona una plantilla y genera los indicadores</div>
          <div className="empty-desc">Los graficos se generaran automaticamente con los datos cargados mas recientes.</div>
        </div>
      )}
    </div>
  )
}
