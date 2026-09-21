import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchReportesConsultas, fetchReporteConsulta, crearReporteConsulta, actualizarReporteConsulta,
  eliminarReporteConsulta, exportarReportesConsultas,
  fetchReportesMedicamentos, fetchReporteMedicamento, crearReporteMedicamento, actualizarReporteMedicamento,
  eliminarReporteMedicamento, exportarReportesMedicamentos,
} from '../api'

const PX_FIELDS = [
  { key:'consecutivo', label:'Consecutivo', type:'number', required:true },
  { key:'periodo_reportado', label:'Periodo reportado', type:'number', required:true },
  { key:'cod_eps', label:'Cod. EPS', type:'text', required:true },
  { key:'tipo_documento', label:'Tipo documento', type:'select', required:true,
    options:['MS','RC','TI','CC','CE','PA','CD','AS','CN','SC','PE','PT'] },
  { key:'documento', label:'Documento', type:'text', required:true },
  { key:'identificador_orden', label:'Identificador de la orden de servicio', type:'text', required:true },
  { key:'cod_municipio', label:'Código Municipio', type:'text', required:true, pattern:'^\d{5}$' },
  { key:'cod_diagnostico', label:'Código Diagnóstico Principal', type:'text', required:true },
  { key:'cups', label:'CUPS', type:'number', required:true },
  { key:'procedimiento_consulta', label:'Procedimiento o consulta', type:'text', required:true },
  { key:'clase_pendiente', label:'Clase de pendiente', type:'select', required:true,
    options:[{v:1,l:'1 - No direccionado (>3 días)'},{v:2,l:'2 - Direccionado, no programado (>10 días)'},{v:3,l:'3 - Programado no realizado'}] },
  { key:'cantidad_ordenada', label:'Cantidad ordenada', type:'number', required:true },
  { key:'cantidad_prestacion_efectiva', label:'Cantidad con prestación efectiva', type:'number', required:true },
  { key:'cantidad_pendiente', label:'Cantidad pendiente', type:'number', required:true },
  { key:'causa_pendiente', label:'Causa del pendiente', type:'number', required:true },
  { key:'observacion_causa', label:'Observación causa del pendiente', type:'text', required:false },
  { key:'fecha_orden', label:'Fecha de orden', type:'date', required:true },
  { key:'fecha_pendiente', label:'Fecha del pendiente', type:'date', required:true },
  { key:'fecha_cierre', label:'Fecha de Cierre', type:'date', required:false },
  { key:'patologia', label:'Patología/Condición clínica', type:'select', required:true,
    options:['Asma','Cáncer','Diabetes','EPOC','HTA','Hemofilia','HT pulmonar','Enf. huérfana','Salud mental','Trasplante','VIH','Gestación','OTRA'] },
  { key:'mecanismo_financiacion', label:'Mecanismo de financiación', type:'select', required:true,
    options:['UPC','Pmáx','Recobro'] },
  { key:'tutela', label:'Tutela', type:'select', required:true, options:['SI','NO'] },
  { key:'identificacion_prestador', label:'Identificación del prestador', type:'text', required:true },
]

const MED_FIELDS = [
  { key:'consecutivo', label:'Consecutivo', type:'number', required:true },
  { key:'periodo_reportado', label:'Periodo reportado', type:'number', required:true },
  { key:'cod_eps', label:'Cod. EPS', type:'text', required:true },
  { key:'tipo_documento', label:'Tipo documento', type:'select', required:true,
    options:['MS','RC','TI','CC','CE','PA','CD','AS','CN','SC','PE','PT'] },
  { key:'documento', label:'Documento', type:'text', required:true },
  { key:'identificador_prescripcion', label:'Identificador de la prescripción', type:'text', required:true },
  { key:'cod_municipio', label:'Código Municipio', type:'text', required:true, pattern:'^\d{5}$' },
  { key:'cod_diagnostico', label:'Código Diagnóstico Principal', type:'text', required:true },
  { key:'medicamento_atc', label:'MEDICAMENTO - ATC', type:'text', required:true },
  { key:'medicamento_concentracion', label:'MEDICAMENTO - Concentración', type:'text', required:true },
  { key:'medicamento_unidad', label:'MEDICAMENTO - Unidad de concentración', type:'text', required:true },
  { key:'forma_farmaceutica', label:'Forma farmacéutica', type:'text', required:true },
  { key:'medicamento_nombre', label:'MEDICAMENTO (Nombre comercial)', type:'text', required:true },
  { key:'mecanismo_financiacion', label:'Mecanismo de financiación', type:'select', required:true,
    options:['UPC','Pmáx','Recobro'] },
  { key:'cantidad_prescrita', label:'Cantidad prescrita', type:'number', required:true },
  { key:'dias_tratamiento', label:'Días de tratamiento', type:'number', required:true },
  { key:'cantidad_dispensada', label:'Cantidad dispensada', type:'number', required:true },
  { key:'cum_medicamento', label:'CUM del medicamento dispensado', type:'text', required:true },
  { key:'cantidad_pendiente', label:'Cantidad pendiente', type:'number', required:true },
  { key:'causa_pendiente', label:'Causa del pendiente', type:'number', required:true },
  { key:'observacion_causa', label:'Observación causa del pendiente', type:'text', required:false },
  { key:'fecha_prescripcion', label:'Fecha prescripción', type:'date', required:true },
  { key:'fecha_pendiente', label:'Fecha pendiente', type:'date', required:true },
  { key:'fecha_cierre', label:'Fecha Cierre', type:'date', required:false },
  { key:'cantidad_dispensada_cierre', label:'Cantidad dispensada para cierre', type:'number', required:false },
  { key:'patologia', label:'Patología/Condición clínica', type:'select', required:true,
    options:['Asma','Cáncer','Diabetes','EPOC','HTA','Hemofilia','HT pulmonar','Enf. huérfana','Salud mental','Trasplante','VIH','Gestación','OTRA'] },
  { key:'identificacion_prestador', label:'Identificación del gestor/prestador', type:'text', required:true },
  { key:'tutela', label:'Tutela', type:'select', required:true, options:['SI','NO'] },
]

const SECTIONS_PX = [
  { title:'Información general', keys:['consecutivo','periodo_reportado','cod_eps'] },
  { title:'Identificación', keys:['tipo_documento','documento','identificador_orden'] },
  { title:'Ubicación y diagnóstico', keys:['cod_municipio','cod_diagnostico','cups','procedimiento_consulta'] },
  { title:'Pendiente', keys:['clase_pendiente','cantidad_ordenada','cantidad_prestacion_efectiva','cantidad_pendiente','causa_pendiente','observacion_causa'] },
  { title:'Fechas', keys:['fecha_orden','fecha_pendiente','fecha_cierre'] },
  { title:'Clínica y financiación', keys:['patologia','mecanismo_financiacion','tutela'] },
  { title:'Prestador', keys:['identificacion_prestador'] },
]

const SECTIONS_MED = [
  { title:'Información general', keys:['consecutivo','periodo_reportado','cod_eps'] },
  { title:'Identificación', keys:['tipo_documento','documento','identificador_prescripcion'] },
  { title:'Ubicación y diagnóstico', keys:['cod_municipio','cod_diagnostico'] },
  { title:'Medicamento', keys:['medicamento_atc','medicamento_concentracion','medicamento_unidad','forma_farmaceutica','medicamento_nombre'] },
  { title:'Prescripción y cantidades', keys:['mecanismo_financiacion','cantidad_prescrita','dias_tratamiento','cantidad_dispensada','cum_medicamento','cantidad_pendiente','causa_pendiente','observacion_causa'] },
  { title:'Fechas', keys:['fecha_prescripcion','fecha_pendiente','fecha_cierre','cantidad_dispensada_cierre'] },
  { title:'Clínica', keys:['patologia','identificacion_prestador','tutela'] },
]

const ESTADO_COLORS = { borrador:'#6b7280', con_errores:'#dc2626', validado:'#16a34a', modificado:'#d97706' }
const ESTADO_LABELS = { borrador:'Borrador', con_errores:'Con errores', validado:'Validado', modificado:'Modificado' }

function StatBadge({ label, value, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background:color, display:'inline-block' }} />
      <span>{label}: <strong style={{ color:'var(--text-primary)' }}>{value}</strong></span>
    </div>
  )
}

function FieldInput({ field, value, onChange, disabled }) {
  const base = 'w-full px-3 py-2 rounded-lg text-sm border transition-colors'
  const cls = `${base} border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]`
  if (field.type === 'select') {
    const opts = Array.isArray(field.options) ? field.options : []
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} className={cls}>
        <option value="">Seleccionar...</option>
        {opts.map(o => {
          const val = typeof o === 'object' ? o.v : o
          const lbl = typeof o === 'object' ? o.l : o
          return <option key={val} value={val}>{lbl}</option>
        })}
      </select>
    )
  }
  return (
    <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
      value={value || ''} onChange={e => onChange(field.key, e.target.value)} disabled={disabled}
      placeholder={field.label} className={cls} />
  )
}

export default function ReportesView() {
  const [tab, setTab] = useState('consultas')
  const [view, setView] = useState('gestion')
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formErrors, setFormErrors] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fields = tab === 'consultas' ? PX_FIELDS : MED_FIELDS
  const sections = tab === 'consultas' ? SECTIONS_PX : SECTIONS_MED
  const fetchList = tab === 'consultas' ? fetchReportesConsultas : fetchReportesMedicamentos
  const fetchOne = tab === 'consultas' ? fetchReporteConsulta : fetchReporteMedicamento
  const crear = tab === 'consultas' ? crearReporteConsulta : crearReporteMedicamento
  const actualizar = tab === 'consultas' ? actualizarReporteConsulta : actualizarReporteMedicamento
  const eliminar = tab === 'consultas' ? eliminarReporteConsulta : eliminarReporteMedicamento
  const exportar = tab === 'consultas' ? exportarReportesConsultas : exportarReportesMedicamentos

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize, search, ...filters }
      const res = await fetchList(params)
      setData(res?.registros || [])
      setTotal(res?.total || 0)
    } catch { setData([]); setTotal(0) }
    setLoading(false)
  }, [page, pageSize, search, filters, fetchList])

  useEffect(() => { loadData() }, [loadData])

  const totalPages = Math.ceil(total / pageSize)

  const stats = useMemo(() => {
    const s = { validados:0, borradores:0, con_errores:0, modificados:0 }
    data.forEach(r => {
      if (r.estado === 'validado') s.validados++
      else if (r.estado === 'borrador') s.borradores++
      else if (r.estado === 'con_errores') s.con_errores++
      else if (r.estado === 'modificado') s.modificados++
    })
    return s
  }, [data])

  const handleExport = async () => {
    setDownloading(true)
    try {
      const blob = await exportar(filters)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const tipo = tab === 'consultas' ? 'PX_Consultas' : 'Medicamentos'
        a.download = `Matriz_${tipo}_${new Date().toISOString().slice(0,10)}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setDownloading(false)
  }

  const openCreate = () => { setEditing(null); setFormErrors([]); setFormOpen(true) }
  const openEdit = async (id) => {
    try {
      const d = await fetchOne(id)
      setEditing(d); setFormErrors([]); setFormOpen(true)
    } catch {}
  }
  const openDetail = async (id) => {
    try {
      const d = await fetchOne(id)
      setDetailData(d); setDetailOpen(true)
    } catch {}
  }

  const handleSave = async (formData, isEdit) => {
    setSaving(true)
    try {
      const res = isEdit ? await actualizar(editing.id, formData) : await crear(formData)
      if (res?.errors?.length) { setFormErrors(res.errors); setSaving(false); return }
      setFormOpen(false); setEditing(null); setFormErrors([]); loadData()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await eliminar(confirmDelete.id); setConfirmDelete(null); loadData() } catch {}
  }

  const renderFormField = (f, data, onChange, disabled) => (
    <div key={f.key} className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color:'var(--text-secondary)' }}>
        {f.label} {f.required && <span style={{ color:'var(--danger)' }}>*</span>}
      </label>
      <FieldInput field={f} value={data?.[f.key]} onChange={onChange} disabled={disabled} />
    </div>
  )

  const colHeaders = tab === 'consultas'
    ? ['#','Periodo','EPS','Tipo','Documento','Orden','Municipio','Estado','Acciones']
    : ['#','Periodo','EPS','Tipo','Documento','Prescripción','ATC','Estado','Acciones']

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6" style={{ fontFamily:'var(--font-body)' }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>
            Reporte de procedimientos o consultas pendientes
          </h1>
          <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>Captura, validación y gestión de reportes pendientes</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background:'var(--action-primary)' }}>
          + Nuevo reporte
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ background:'var(--bg-subtle)' }}>
        {[
          { key:'consultas', label:'Consultas / Procedimientos' },
          { key:'medicamentos', label:'Medicamentos' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSearch(''); setFilters({}) }}
            className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'var(--bg-surface)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow-xs)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap" style={{ color:'var(--text-secondary)', fontSize:13 }}>
        <StatBadge label="Validados" value={stats.validados} color="#16a34a" />
        <StatBadge label="Borradores" value={stats.borradores} color="#6b7280" />
        <StatBadge label="Con errores" value={stats.con_errores} color="#dc2626" />
        <StatBadge label="Total" value={total} color="var(--brand-strong)" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input type="text" placeholder="Buscar por documento, consecutivo, orden..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm border"
          style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }} />
        <button onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
          style={{ borderColor:'var(--border-subtle)', color:'var(--text-secondary)' }}>
          {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>
        <button onClick={handleExport} disabled={downloading}
          className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
          style={{ borderColor:'var(--border-subtle)', color:'var(--text-secondary)' }}>
          {downloading ? 'Descargando...' : 'Descargar Excel'}
        </button>
      </div>

      {showFilters && (
        <div className="p-4 rounded-lg border grid grid-cols-2 md:grid-cols-4 gap-3"
          style={{ borderColor:'var(--border-subtle)', background:'var(--bg-subtle)' }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color:'var(--text-muted)' }}>Periodo</label>
            <input type="text" value={filters.periodo || ''} onChange={e => { setFilters({...filters, periodo:e.target.value}); setPage(1) }}
              className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color:'var(--text-muted)' }}>EPS</label>
            <input type="text" value={filters.eps || ''} onChange={e => { setFilters({...filters, eps:e.target.value}); setPage(1) }}
              className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color:'var(--text-muted)' }}>Tipo documento</label>
            <select value={filters.tipo_doc || ''} onChange={e => { setFilters({...filters, tipo_doc:e.target.value}); setPage(1) }}
              className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }}>
              <option value="">Todos</option>
              {PX_FIELDS.find(f=>f.key==='tipo_documento').options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color:'var(--text-muted)' }}>Estado</label>
            <select value={filters.estado || ''} onChange={e => { setFilters({...filters, estado:e.target.value}); setPage(1) }}
              className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }}>
              <option value="">Todos</option>
              {Object.entries(ESTADO_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {tab === 'consultas' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color:'var(--text-muted)' }}>Municipio</label>
                <input type="text" value={filters.municipio || ''} onChange={e => { setFilters({...filters, municipio:e.target.value}); setPage(1) }}
                  className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color:'var(--text-muted)' }}>CUPS</label>
                <input type="text" value={filters.cups || ''} onChange={e => { setFilters({...filters, cups:e.target.value}); setPage(1) }}
                  className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color:'var(--text-muted)' }}>Clase pendiente</label>
                <select value={filters.clase_pendiente || ''} onChange={e => { setFilters({...filters, clase_pendiente:e.target.value}); setPage(1) }}
                  className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }}>
                  <option value="">Todas</option>
                  <option value="1">1 - No direccionado</option>
                  <option value="2">2 - Direccionado no programado</option>
                  <option value="3">3 - Programado no realizado</option>
                </select>
              </div>
            </>
          )}
          {tab === 'medicamentos' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color:'var(--text-muted)' }}>ATC</label>
                <input type="text" value={filters.atc || ''} onChange={e => { setFilters({...filters, atc:e.target.value}); setPage(1) }}
                  className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color:'var(--text-muted)' }}>Mecanismo</label>
                <select value={filters.mecanismo || ''} onChange={e => { setFilters({...filters, mecanismo:e.target.value}); setPage(1) }}
                  className="px-2 py-1.5 rounded border text-sm" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)' }}>
                  <option value="">Todos</option>
                  {['UPC','Pmáx','Recobro'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="flex items-end">
            <button onClick={() => { setFilters({}); setPage(1) }}
              className="px-3 py-1.5 rounded text-sm" style={{ color:'var(--danger)' }}>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto" style={{ borderColor:'var(--border-subtle)' }}>
        <table className="w-full text-sm" style={{ color:'var(--text-primary)' }}>
          <thead>
            <tr style={{ background:'var(--bg-subtle)' }}>
              {colHeaders.map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color:'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colHeaders.length} className="px-3 py-8 text-center" style={{ color:'var(--text-muted)' }}>Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={colHeaders.length} className="px-3 py-8 text-center" style={{ color:'var(--text-muted)' }}>No hay registros</td></tr>
            ) : data.map((r, i) => (
              <tr key={r.id} className="border-t transition-colors hover:bg-[var(--bg-surface-hover)]" style={{ borderColor:'var(--border-subtle)' }}>
                <td className="px-3 py-2">{(page-1)*pageSize + i + 1}</td>
                <td className="px-3 py-2">{r.periodo_reportado}</td>
                <td className="px-3 py-2">{r.cod_eps}</td>
                <td className="px-3 py-2">{r.tipo_documento}</td>
                <td className="px-3 py-2 font-medium">{r.documento}</td>
                <td className="px-3 py-2">{tab === 'consultas' ? r.identificador_orden : r.identificador_prescripcion}</td>
                <td className="px-3 py-2">{r.cod_municipio}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: ESTADO_COLORS[r.estado]+'20', color: ESTADO_COLORS[r.estado] }}>
                    {ESTADO_LABELS[r.estado] || r.estado}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => openDetail(r.id)} className="px-2 py-1 rounded text-xs" style={{ color:'var(--brand-strong)' }}>Ver</button>
                    <button onClick={() => openEdit(r.id)} className="px-2 py-1 rounded text-xs" style={{ color:'var(--action-primary)' }}>Editar</button>
                    <button onClick={() => setConfirmDelete(r)} className="px-2 py-1 rounded text-xs" style={{ color:'var(--danger)' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color:'var(--text-secondary)' }}>
          <span>Mostrando {(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} de {total} registros</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page-1))} disabled={page<=1}
              className="px-3 py-1 rounded border text-xs" style={{ borderColor:'var(--border-subtle)' }}>Anterior</button>
            {Array.from({length: Math.min(5, totalPages)}, (_,i) => {
              const p = Math.max(1, Math.min(page-2, totalPages-4)) + i
              if (p > totalPages) return null
              return <button key={p} onClick={() => setPage(p)}
                className="px-3 py-1 rounded border text-xs" style={{ borderColor: p===page ? 'var(--brand-strong)' : 'var(--border-subtle)', background: p===page ? 'var(--surface-brand-weak)' : 'transparent' }}>{p}</button>
            })}
            <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page>=totalPages}
              className="px-3 py-1 rounded border text-xs" style={{ borderColor:'var(--border-subtle)' }}>Siguiente</button>
          </div>
        </div>
      )}

      {formOpen && (
        <FormModal
          fields={fields} sections={sections} data={editing} errors={formErrors} saving={saving}
          onSave={handleSave} onClose={() => { setFormOpen(false); setEditing(null); setFormErrors([]) }}
          isEdit={!!editing} />
      )}

      {detailOpen && detailData && (
        <DetailModal data={detailData} fields={fields} sections={sections}
          onClose={() => { setDetailOpen(false); setDetailData(null) }}
          onEdit={() => { setDetailOpen(false); openEdit(detailData.id) }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl p-6 max-w-sm w-full" style={{ background:'var(--bg-surface)' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color:'var(--text-primary)' }}>Confirmar eliminación</h3>
            <p className="text-sm mb-4" style={{ color:'var(--text-secondary)' }}>
              ¿Eliminar registro #{confirmDelete.id}? Esta acción es irreversible.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor:'var(--border-subtle)', color:'var(--text-secondary)' }}>Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background:'var(--danger)' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormModal({ fields, sections, data, errors, saving, onSave, onClose, isEdit }) {
  const [formData, setFormData] = useState(() => {
    const d = {}
    fields.forEach(f => { d[f.key] = data?.[f.key] || '' })
    return d
  })
  const [openSections, setOpenSections] = useState(() => {
    const s = {}; sections.forEach((sec,i) => { s[i] = i === 0 }); return s
  })

  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))
  const toggleSection = i => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))

  const handleSubmit = (status) => {
    const submission = { ...formData }
    if (status === 'borrador') { onSave(submission, isEdit); return }
    onSave(submission, isEdit)
  }

  const errorMap = {}
  errors.forEach(e => { errorMap[e.variable] = e.error })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-3xl mb-8" style={{ background:'var(--bg-surface)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor:'var(--border-subtle)' }}>
          <h2 className="text-lg font-bold" style={{ color:'var(--text-primary)' }}>{isEdit ? 'Editar registro' : 'Nuevo registro'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color:'var(--text-muted)' }}>✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {errors.length > 0 && (
            <div className="p-3 rounded-lg border" style={{ borderColor:'var(--danger)', background:'var(--danger-bg)' }}>
              <p className="text-sm font-medium mb-1" style={{ color:'var(--danger)' }}>Errores de validación:</p>
              {errors.map((e,i) => (
                <p key={i} className="text-xs" style={{ color:'var(--danger)' }}>
                  <strong>{e.variable}:</strong> {e.error}. {e.correccion}
                </p>
              ))}
            </div>
          )}
          {sections.map((sec, si) => (
            <div key={si} className="rounded-lg border" style={{ borderColor:'var(--border-subtle)' }}>
              <button onClick={() => toggleSection(si)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium text-left"
                style={{ color:'var(--text-primary)', background:'var(--bg-subtle)' }}>
                <span>{sec.title}</span>
                <span style={{ color:'var(--text-muted)' }}>{openSections[si] ? '−' : '+'}</span>
              </button>
              {openSections[si] && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sec.keys.map(k => {
                    const f = fields.find(ff => ff.key === k)
                    if (!f) return null
                    return (
                      <div key={k} className={k === 'observacion_causa' || k === 'procedimiento_consulta' || k === 'medicamento_nombre' ? 'md:col-span-2' : ''}>
                        {renderFormFieldLocal(f, formData, handleChange, errorMap)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor:'var(--border-subtle)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor:'var(--border-subtle)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={() => handleSubmit('borrador')} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor:'var(--border-subtle)', color:'var(--text-secondary)' }}>Guardar borrador</button>
          <button onClick={() => handleSubmit('validar')} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background:'var(--action-primary)' }}>{saving ? 'Guardando...' : 'Validar y guardar'}</button>
        </div>
      </div>
    </div>
  )
}

function renderFormFieldLocal(f, data, onChange, errorMap) {
  const base = 'w-full px-3 py-2 rounded-lg text-sm border transition-colors'
  const hasError = !!errorMap[f.label]
  const cls = `${base} ${hasError ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]'} bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]`

  let input
  if (f.type === 'select') {
    const opts = Array.isArray(f.options) ? f.options : []
    input = (
      <select value={data[f.key] || ''} onChange={e => onChange(f.key, e.target.value)} className={cls}>
        <option value="">Seleccionar...</option>
        {opts.map(o => {
          const val = typeof o === 'object' ? o.v : o
          const lbl = typeof o === 'object' ? o.l : o
          return <option key={val} value={val}>{lbl}</option>
        })}
      </select>
    )
  } else {
    input = (
      <input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
        value={data[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}
        placeholder={f.label} className={cls} />
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color:'var(--text-secondary)' }}>
        {f.label} {f.required && <span style={{ color:'var(--danger)' }}>*</span>}
      </label>
      {input}
      {hasError && <p className="text-xs" style={{ color:'var(--danger)' }}>{errorMap[f.label]}</p>}
    </div>
  )
}

function DetailModal({ data, fields, sections, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-3xl mb-8" style={{ background:'var(--bg-surface)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor:'var(--border-subtle)' }}>
          <h2 className="text-lg font-bold" style={{ color:'var(--text-primary)' }}>Detalle del registro #{data.id}</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color:'var(--text-muted)' }}>✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: ESTADO_COLORS[data.estado]+'20', color: ESTADO_COLORS[data.estado] }}>
              {ESTADO_LABELS[data.estado] || data.estado}
            </span>
          </div>
          {sections.map((sec, si) => (
            <div key={si} className="rounded-lg border" style={{ borderColor:'var(--border-subtle)' }}>
              <div className="p-3 text-sm font-medium" style={{ color:'var(--text-primary)', background:'var(--bg-subtle)' }}>{sec.title}</div>
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {sec.keys.map(k => {
                  const f = fields.find(ff => ff.key === k)
                  if (!f) return null
                  const val = data[k]
                  return (
                    <div key={k} className={k === 'observacion_causa' || k === 'procedimiento_consulta' || k === 'medicamento_nombre' ? 'md:col-span-2' : ''}>
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>{f.label}</p>
                      <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{val || '—'}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor:'var(--border-subtle)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor:'var(--border-subtle)', color:'var(--text-secondary)' }}>Cerrar</button>
          <button onClick={onEdit} className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background:'var(--action-primary)' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}
