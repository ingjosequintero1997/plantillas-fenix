import React, { useEffect, useState, useCallback } from 'react'
import { fetchAlertas, fetchAlertaDetalle, fetchBandeja, fetchFicha, crearSeguimiento, exportarAlertas, fetchAlertasFiltros } from '../api'

const REGIMEN_LABEL = { S: 'Subsidiado', C: 'Contributivo' }
import Pagination from './Pagination'

const PAGE_SIZE = 50

// Semáforo estilo SIRENAGEST.
const SEM = {
  rojo: { label: 'Rojo', color: '#B42318', bg: 'var(--danger-bg)', dot: '#DC2626', desc: 'Riesgo severo / pérdida del sistema' },
  amarillo: { label: 'Amarillo', color: '#B54708', bg: '#FFF4E5', dot: '#F59E0B', desc: 'Requiere seguimiento o control próximo' },
  verde: { label: 'Verde', color: '#067647', bg: '#ECFDF3', dot: '#16A34A', desc: 'Al día con sus controles' },
}
const SEM_ORDER = ['rojo', 'amarillo', 'verde']

const TIPOS_GESTION = ['Búsqueda activa telefónica', 'Visita domiciliaria', 'Gestión de agenda/cita', 'Demanda inducida', 'Otro']
const RESULTADOS = ['Efectiva', 'No efectiva']

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function SemBadge({ color }) {
  const m = SEM[color] || SEM.verde
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.68rem] font-semibold shrink-0" style={{ color: m.color, backgroundColor: m.bg }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
  )
}

// ── Formulario "Agregar seguimiento" ────────────────────────────────
function SeguimientoForm({ gestante, onSaved, onCancel }) {
  const [form, setForm] = useState({ tipo_seguimiento: TIPOS_GESTION[0], resultado: RESULTADOS[0], fecha_seguimiento: hoyISO(), observacion: '', compromiso: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await crearSeguimiento({
        paciente_documento: gestante.numero_id,
        paciente_nombre: gestante.nombre,
        tipo_alerta: gestante._alertaLabel || '',
        ...form,
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el seguimiento')
    } finally {
      setSaving(false)
    }
  }

  const L = ({ children }) => <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{children}</span>

  return (
    <form onSubmit={submit} className="panel" style={{ borderLeft: '3px solid var(--primary)' }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Agregar seguimiento</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block"><L>Tipo de gestión</L>
          <select value={form.tipo_seguimiento} onChange={(e) => setForm({ ...form, tipo_seguimiento: e.target.value })} className="w-full input">
            {TIPOS_GESTION.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block"><L>Resultado de la gestión</L>
          <select value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} className="w-full input">
            {RESULTADOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block"><L>Fecha de la gestión</L>
          <input type="date" value={form.fecha_seguimiento} onChange={(e) => setForm({ ...form, fecha_seguimiento: e.target.value })} className="w-full input" required />
        </label>
        <label className="block"><L>Compromiso / Próxima cita</L>
          <input type="date" value={form.compromiso} onChange={(e) => setForm({ ...form, compromiso: e.target.value })} className="w-full input" />
        </label>
        <label className="block sm:col-span-2"><L>Observaciones / Evolución</L>
          <textarea value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} className="w-full input" rows={3}
            placeholder="Ej: Se contacta a la madre, manifiesta que no tenía dinero para el transporte..." />
        </label>
      </div>
      {error && <div className="rounded-lg px-3 py-2 text-xs mt-3" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>{error}</div>}
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} disabled={saving} className="btn-secondary text-sm px-3 py-1.5">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm px-3 py-1.5">{saving ? 'Guardando...' : 'Guardar seguimiento'}</button>
      </div>
    </form>
  )
}

// ── Ficha nominal con línea de tiempo ───────────────────────────────
function FichaView({ numeroId, onBack }) {
  const [ficha, setFicha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setFicha(await fetchFicha(numeroId))
    } catch (e) {
      setError(e.message || 'Error cargando la ficha')
    } finally {
      setLoading(false)
    }
  }, [numeroId])

  useEffect(() => { cargar() }, [cargar])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-20 w-full rounded-xl" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    )
  }
  if (error) return <div className="panel" style={{ color: 'var(--danger)' }}>{error}</div>
  if (!ficha) return null

  const g = ficha.gestante
  const sem = ficha.semaforo || { color: 'verde' }
  const semMeta = SEM[sem.color] || SEM.verde

  return (
    <div className="space-y-5 fade-in">
      <div className="panel" style={{ borderLeft: `4px solid ${semMeta.dot}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="btn-ghost px-2 py-1" title="Volver">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="page-title" style={{ fontSize: '1.1rem' }}>{g.nombre || '—'}</div>
            <div className="page-subtitle">
              {g.tipo_id} {g.numero_id} · {g.departamento || '—'} / {g.municipio || '—'} · {g.nombre_ips || '—'}
            </div>
          </div>
          <SemBadge color={sem.color} />
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-sm px-3 py-1.5">
            {showForm ? 'Cancelar' : 'Agregar seguimiento'}
          </button>
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {sem.motivo} · Último control: {g.ultimo_control || '—'} · Controles: {g.total_controles || '—'} · Edad gest.: {g.edad_gestacional || '—'}
        </div>
      </div>

      {showForm && (
        <SeguimientoForm
          gestante={{ ...g, _alertaLabel: (sem.alertas || []).join(', ') }}
          onSaved={() => { setShowForm(false); cargar() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="panel">
        <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Línea de tiempo</div>
        {(!ficha.timeline || ficha.timeline.length === 0) ? (
          <div className="empty">
            <div className="empty-title">Sin eventos</div>
            <div className="empty-desc">No hay atenciones ni seguimientos registrados.</div>
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
            {ficha.timeline.map((e, i) => (
              <div key={i} className="relative mb-5">
                <span
                  className="absolute -left-[18px] top-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: e.tipo === 'seguimiento' ? '#2563EB' : semMeta.dot, boxShadow: '0 0 0 2px var(--bg-surface)' }}
                />
                <div className="text-[0.7rem] font-medium" style={{ color: 'var(--text-muted)' }}>{e.fecha || '—'}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.titulo}</div>
                {e.detalle && <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{e.detalle}</div>}
                <div className="text-[0.68rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.origen}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Vista principal del módulo ──────────────────────────────────────
export default function AlertasView() {
  const [fichaId, setFichaId] = useState(null)

  if (fichaId) {
    return <FichaView numeroId={fichaId} onBack={() => setFichaId(null)} />
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <div className="page-title">Alertas</div>
          <div className="page-subtitle">Bandeja única · semáforo de riesgo materno</div>
        </div>
      </div>

      <PorAlertaView onOpenFicha={setFichaId} />
    </div>
  )
}

// ── Bandeja de alertas ──────────────────────────────────────────────
function BandejaView({ onOpenFicha }) {
  const [data, setData] = useState({ gestantes: [], conteo: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [color, setColor] = useState('')

  const cargar = useCallback(async (qq, cc) => {
    setLoading(true); setError('')
    try {
      const res = await fetchBandeja(qq, cc)
      setData({ gestantes: Array.isArray(res?.gestantes) ? res.gestantes : [], conteo: res?.conteo || {} })
    } catch (e) {
      setError(e.message || 'Error cargando la bandeja')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => cargar(q, color), q ? 350 : 0)
    return () => clearTimeout(t)
  }, [q, color, cargar])

  return (
    <div className="space-y-5">
      {/* Semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SEM_ORDER.map((c) => {
          const m = SEM[c]
          const active = color === c
          return (
            <button
              key={c}
              onClick={() => setColor(active ? '' : c)}
              className="panel text-left transition-all"
              style={{ borderLeft: `3px solid ${m.dot}`, outline: active ? `2px solid ${m.dot}` : 'none', outlineOffset: 2, cursor: 'pointer' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.dot }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
                  </div>
                  <div className="text-[0.7rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
                <div className="text-2xl font-bold" style={{ color: m.color }}>{data.conteo[c] || 0}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filtro rápido */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por documento o nombre..." className="input pl-9" />
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>}

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      ) : data.gestantes.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="empty-title">Sin resultados</div>
          <div className="empty-desc">{q || color ? 'No hay gestantes que coincidan con el filtro.' : 'No hay data validada para analizar.'}</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Semáforo</th><th>Nombre y apellido</th><th>Documento</th><th>Departamento</th>
                <th>Municipio</th><th>IPS</th><th>Días sin control</th><th>Alertas</th><th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.gestantes.map((g, i) => (
                <tr key={`${g.numero_id}-${i}`}>
                  <td><SemBadge color={g.color} /></td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{g.nombre || '—'}</td>
                  <td>{g.tipo_id} {g.numero_id}</td>
                  <td>{g.departamento || '—'}</td>
                  <td>{g.municipio || '—'}</td>
                  <td>{g.nombre_ips || '—'}</td>
                  <td>{g.dias_sin_control != null ? g.dias_sin_control : '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1" style={{ maxWidth: 320 }}>
                      {(g.alertas || []).length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        g.alertas.map((a) => (
                          <span
                            key={a.key}
                            className="px-1.5 py-0.5 rounded text-[0.66rem] font-medium"
                            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                            title={`Criticidad ${a.criticidad}`}
                          >
                            {a.label}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <button onClick={() => onOpenFicha(g.numero_id)} className="btn-secondary text-xs px-3 py-1" style={{ whiteSpace: 'nowrap' }}>
                      Ver ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Vista "Por alerta" (tarjetas) ───────────────────────────────────
function PorAlertaView({ onOpenFicha }) {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detalle, setDetalle] = useState([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(false)
  const [fDepto, setFDepto] = useState('')
  const [fMunicipio, setFMunicipio] = useState('')
  const [fRegimen, setFRegimen] = useState('')

  const descargar = async () => {
    setDownloading(true); setError('')
    try { await exportarAlertas({ departamento: fDepto, municipio: fMunicipio, regimen: fRegimen }) } catch (e) { setError(e.message || 'No se pudo exportar') } finally { setDownloading(false) }
  }

  const loadAlertas = useCallback(async (f = {}) => {
    setLoading(true); setError('')
    try {
      const data = await fetchAlertas(f)
      setAlertas(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Error cargando las alertas')
      setAlertas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAlertas({}) }, [loadAlertas])

  const [opciones, setOpciones] = useState({ departamentos: [], municipios: [], regimenes: [] })
  useEffect(() => {
    fetchAlertasFiltros()
      .then((o) => setOpciones({ departamentos: o?.departamentos || [], municipios: o?.municipios || [], regimenes: o?.regimenes || [] }))
      .catch(() => {})
  }, [])

  const openAlerta = async (alerta) => {
    setSelected(alerta); setDetalle([]); setSearch(''); setPage(1)
    setLoadingDetalle(true); setError('')
    try {
      const data = await fetchAlertaDetalle(alerta.key)
      setDetalle(Array.isArray(data?.usuarias) ? data.usuarias : [])
    } catch (e) {
      setError(e.message || 'Error cargando el detalle')
    } finally {
      setLoadingDetalle(false)
    }
  }

  if (selected) {
    const qq = search.trim().toUpperCase()
    const filtradas = qq
      ? detalle.filter((r) => [r.nombre, r.numero_id, r.nombre_ips, r.aseguradora, r.municipio].some((v) => String(v || '').toUpperCase().includes(qq)))
      : detalle
    const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
    const pageRows = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    return (
      <div className="space-y-5">
        <div className="panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="btn-ghost px-2 py-1" title="Volver">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <div className="page-title" style={{ fontSize: '1.1rem' }}>{selected.label}</div>
              <div className="page-subtitle">{loadingDetalle ? 'Cargando...' : `${filtradas.length} usuaria${filtradas.length !== 1 ? 's' : ''}`}</div>
            </div>
          </div>
        </div>
        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>}
        <div className="relative max-w-md">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar..." className="input" />
        </div>
        {loadingDetalle ? (
          <div className="space-y-3"><div className="skeleton h-12 w-full rounded-xl" /><div className="skeleton h-12 w-full rounded-xl" /></div>
        ) : pageRows.length === 0 ? (
          <div className="empty"><div className="empty-title">Sin registros</div><div className="empty-desc">No hay usuarias que cumplan esta alerta.</div></div>
        ) : (
          <div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th className="text-center">Ficha</th><th>Nombre y apellido</th><th>Documento</th><th>Departamento</th><th>Municipio</th><th>IPS</th><th>Aseguradora</th><th>Edad</th><th>Edad gest.</th></tr></thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={`${r.numero_id}-${i}`}>
                      <td className="text-center">
                        <button onClick={() => onOpenFicha(r.numero_id)} className="btn-secondary text-xs px-3 py-1" style={{ whiteSpace: 'nowrap' }}>Ver ficha</button>
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.nombre || '—'}</td>
                      <td>{r.tipo_id} {r.numero_id}</td>
                      <td>{r.departamento || '—'}</td>
                      <td>{r.municipio || '—'}</td>
                      <td>{r.nombre_ips || '—'}</td>
                      <td>{r.aseguradora || '—'}</td>
                      <td>{r.edad || '—'}</td>
                      <td>{r.edad_gestacional || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    )
  }

  const totalGeneral = alertas.reduce((acc, a) => acc + (Number(a.total) || 0), 0)
  return (
    <div className="space-y-5">
      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>}

      {/* Total (estilo SISPRO) */}
      <div className="flex justify-center">
        <div className="rounded-2xl px-12 py-5 text-center" style={{ background: 'linear-gradient(160deg, #3A863A, #5AAE5A)', color: '#fff', minWidth: 280, boxShadow: '0 6px 20px rgba(90,174,90,0.28)' }}>
          <div className="text-4xl font-bold" style={{ lineHeight: 1 }}>{totalGeneral}</div>
          <div className="text-xs mt-2" style={{ opacity: 0.92 }}>Total de coincidencias de alertas</div>
        </div>
      </div>

      {/* Filtros + Exportar */}
      <div className="panel">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Departamento</span>
            <select value={fDepto} onChange={(e) => setFDepto(e.target.value)} className="input" style={{ minWidth: 170 }}>
              <option value="">Seleccione</option>
              {opciones.departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Municipio</span>
            <select value={fMunicipio} onChange={(e) => setFMunicipio(e.target.value)} className="input" style={{ minWidth: 170 }}>
              <option value="">Seleccione</option>
              {opciones.municipios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Régimen</span>
            <select value={fRegimen} onChange={(e) => setFRegimen(e.target.value)} className="input" style={{ minWidth: 170 }}>
              <option value="">Seleccione</option>
              {opciones.regimenes.map((g) => <option key={g} value={g}>{REGIMEN_LABEL[g] || g}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => loadAlertas({ departamento: fDepto, municipio: fMunicipio, regimen: fRegimen })} className="btn-primary text-sm px-5 py-2">Filtrar</button>
          <div className="flex-1" />
          <button type="button" onClick={descargar} disabled={downloading} className="btn-secondary text-sm px-4 py-2">
            {downloading ? 'Generando Excel...' : 'Exportar a Excel'}
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="page-title">Distribución de alertas</div>
        <div className="page-subtitle">Haga clic en "Hacer seguimiento" para conocer las personas gestantes registradas.</div>
      </div>

      {loading ? (
        <div className="space-y-3"><div className="skeleton h-12 w-full rounded-xl" /><div className="skeleton h-12 w-full rounded-xl" /><div className="skeleton h-12 w-full rounded-xl" /></div>
      ) : (
        <div className="table-wrap" style={{ maxWidth: 940, margin: '0 auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Semáforo</th>
                <th>Alerta</th>
                <th style={{ width: 200 }}>Cantidad personas gestantes</th>
                <th className="text-center" style={{ width: 180 }}>Seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a) => {
                const total = Number(a.total) || 0
                return (
                  <tr key={a.key}>
                    <td>
                      {total > 0
                        ? <SemBadge color={a.criticidad <= 2 ? 'rojo' : a.criticidad === 3 ? 'amarillo' : 'verde'} />
                        : <span className="text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>Sin casos</span>}
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.label}</td>
                    <td>{total}</td>
                    <td className="text-center">
                      <button
                        onClick={() => total > 0 && openAlerta(a)}
                        disabled={total === 0}
                        className="btn-primary text-xs px-4 py-1.5"
                        style={{ whiteSpace: 'nowrap', opacity: total === 0 ? 0.5 : 1, cursor: total === 0 ? 'default' : 'pointer' }}
                      >
                        Hacer seguimiento
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
