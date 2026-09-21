import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchReportesConsultas, fetchReporteConsulta, crearReporteConsulta, actualizarReporteConsulta,
  eliminarReporteConsulta, exportarReportesConsultas,
  fetchReportesMedicamentos, fetchReporteMedicamento, crearReporteMedicamento, actualizarReporteMedicamento,
  eliminarReporteMedicamento, exportarReportesMedicamentos,
} from '../api'

const PX_FIELDS = [
  { key:'consecutivo', label:'Consecutivo del registro', type:'number', required:true, section:'general' },
  { key:'periodo_reportado', label:'PERIODO REPORTADO', type:'number', required:true, section:'general' },
  { key:'cod_eps', label:'Cod. EPS', type:'text', required:true, section:'general' },
  { key:'tipo_documento', label:'Tipo documento', type:'select', required:true, section:'identificacion',
    options:['MS','RC','TI','CC','CE','PA','CD','AS','CN','SC','PE','PT'] },
  { key:'documento', label:'Documento', type:'text', required:true, section:'identificacion' },
  { key:'identificador_orden', label:'Identificador de la orden de servicio', type:'text', required:true, section:'orden' },
  { key:'cod_municipio', label:'CÓDIGO MUNICIPIO', type:'text', required:true, section:'orden' },
  { key:'cod_diagnostico', label:'Código del Diagnóstico Principal', type:'text', required:true, section:'orden' },
  { key:'cups', label:'CUPS', type:'number', required:true, section:'procedimiento' },
  { key:'procedimiento_consulta', label:'Procedimiento o consulta', type:'text', required:true, section:'procedimiento' },
  { key:'clase_pendiente', label:'Clase de pendiente', type:'select', required:true, section:'pendiente',
    options:[{v:1,l:'1 - No direccionado y supera 3 días'},{v:2,l:'2 - Direccionado, no programado y supera 10 días'},{v:3,l:'3 - Programado pero no realizado'}] },
  { key:'cantidad_ordenada', label:'Cantidad ordenada', type:'number', required:true, section:'pendiente' },
  { key:'cantidad_prestacion_efectiva', label:'Cantidad con prestación efectiva', type:'number', required:true, section:'pendiente' },
  { key:'cantidad_pendiente', label:'Cantidad pendiente', type:'number', required:true, section:'pendiente' },
  { key:'causa_pendiente', label:'Causa del pendiente', type:'number', required:true, section:'pendiente' },
  { key:'observacion_causa', label:'Observación causa del pendiente', type:'text', required:false, section:'pendiente' },
  { key:'fecha_orden', label:'Fecha de orden', type:'date', required:true, section:'clinica' },
  { key:'fecha_pendiente', label:'Fecha del pendiente', type:'date', required:true, section:'clinica' },
  { key:'fecha_cierre', label:'Fecha de Cierre', type:'date', required:false, section:'clinica' },
  { key:'patologia', label:'Patologia/Condición clínica', type:'select', required:true, section:'clinica',
    options:['Asma','Cáncer','Diabetes','EPOC','HTA','Hemofilia','HT pulmonar','Enf. huérfana','Salud mental','Trasplante','VIH','Gestación','OTRA'] },
  { key:'mecanismo_financiacion', label:'MECANISMO DE FINANCIACIÓN', type:'select', required:true, section:'clinica',
    options:['UPC','Pmáx','Recobro'] },
  { key:'tutela', label:'Tutela', type:'select', required:true, section:'clinica', options:['SI','NO'] },
  { key:'identificacion_prestador', label:'Identificación del prestador de servicios de salud que genera el pendiente', type:'text', required:true, section:'prestador' },
]

const MED_FIELDS = [
  { key:'consecutivo', label:'Consecutivo del registro', type:'number', required:true, section:'general' },
  { key:'periodo_reportado', label:'Periodo reportado', type:'number', required:true, section:'general' },
  { key:'cod_eps', label:'Cod. EPS', type:'text', required:true, section:'general' },
  { key:'tipo_documento', label:'Tipo documento', type:'select', required:true, section:'identificacion',
    options:['MS','RC','TI','CC','CE','PA','CD','AS','CN','SC','PE','PT'] },
  { key:'documento', label:'Documento', type:'text', required:true, section:'identificacion' },
  { key:'identificador_prescripcion', label:'Identificador de la prescripción', type:'text', required:true, section:'prescripcion' },
  { key:'cod_municipio', label:'CÓDIGO MUNICIPIO', type:'text', required:true, section:'prescripcion' },
  { key:'cod_diagnostico', label:'Código del Diagnóstico Principal', type:'text', required:true, section:'prescripcion' },
  { key:'medicamento_atc', label:'MEDICAMENTO - ATC', type:'text', required:true, section:'medicamento' },
  { key:'medicamento_concentracion', label:'MEDICAMENTO - CONCENTRACIÓN', type:'text', required:true, section:'medicamento' },
  { key:'medicamento_unidad', label:'MEDICAMENTO - UNIDAD DE CONCENTRACIÓN', type:'text', required:true, section:'medicamento' },
  { key:'forma_farmaceutica', label:'FORMA FARMACÉUTICA', type:'text', required:true, section:'medicamento' },
  { key:'medicamento_nombre', label:'MEDICAMENTO (Nombre comercial)', type:'text', required:true, section:'medicamento' },
  { key:'mecanismo_financiacion', label:'MECANISMO DE FINANCIACIÓN', type:'select', required:true, section:'pendiente',
    options:['UPC','Pmáx','Recobro'] },
  { key:'cantidad_prescrita', label:'Cantidad prescrita', type:'number', required:true, section:'pendiente' },
  { key:'dias_tratamiento', label:'Días de tratamiento', type:'number', required:true, section:'pendiente' },
  { key:'cantidad_dispensada', label:'Cantidad dispensada', type:'number', required:true, section:'pendiente' },
  { key:'cum_medicamento', label:'CUM del medicamento dispensado', type:'text', required:true, section:'pendiente' },
  { key:'cantidad_pendiente', label:'Cantidad pendiente', type:'number', required:true, section:'pendiente' },
  { key:'causa_pendiente', label:'Causa del pendiente', type:'number', required:true, section:'pendiente' },
  { key:'observacion_causa', label:'Observación causa del pendiente', type:'text', required:false, section:'pendiente' },
  { key:'fecha_prescripcion', label:'Fecha prescripción', type:'date', required:true, section:'fechas' },
  { key:'fecha_pendiente', label:'Fecha pendiente', type:'date', required:true, section:'fechas' },
  { key:'fecha_cierre', label:'Fecha Cierre', type:'date', required:false, section:'fechas' },
  { key:'cantidad_dispensada_cierre', label:'Cantidad dispensada para el cierre del pendiente', type:'number', required:false, section:'fechas' },
  { key:'patologia', label:'Patologia/Condición clínica', type:'select', required:true, section:'clinica',
    options:['Asma','Cáncer','Diabetes','EPOC','HTA','Hemofilia','HT pulmonar','Enf. huérfana','Salud mental','Trasplante','VIH','Gestación','OTRA'] },
  { key:'identificacion_prestador', label:'Identificación del gestor farmacéutico o prestador de servicios de salud que genera el pendiente', type:'text', required:true, section:'prestador' },
  { key:'tutela', label:'Tutela', type:'select', required:true, section:'prestador', options:['SI','NO'] },
]

const PX_SECTIONS = [
  { key:'general', title:'1. Información general' },
  { key:'identificacion', title:'2. Identificación' },
  { key:'orden', title:'3. Orden' },
  { key:'procedimiento', title:'4. Procedimiento' },
  { key:'pendiente', title:'5. Información del pendiente' },
  { key:'clinica', title:'6. Información clínica' },
  { key:'prestador', title:'7. Prestador' },
]

const MED_SECTIONS = [
  { key:'general', title:'1. Información general' },
  { key:'identificacion', title:'2. Identificación' },
  { key:'prescripcion', title:'3. Prescripción' },
  { key:'medicamento', title:'4. Medicamento' },
  { key:'pendiente', title:'5. Información del pendiente' },
  { key:'fechas', title:'6. Fechas' },
  { key:'clinica', title:'7. Información clínica' },
  { key:'prestador', title:'8. Gestor / Prestador' },
]

const ESTADO_COLORS = { borrador:'badge-neutral', con_errores:'badge-error', validado:'badge-success', modificado:'badge-warning' }
const ESTADO_LABELS = { borrador:'Borrador', con_errores:'Con errores', validado:'Validado', modificado:'Modificado' }

function buildErrorMap(errors) {
  const m = {}
  if (Array.isArray(errors)) errors.forEach(e => { if (e.variable) m[e.variable] = e })
  return m
}

export default function ReportesView() {
  const [subView, setSubView] = useState('menu')
  const [tab, setTab] = useState('consultas')
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
  const [formValid, setFormValid] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fields = tab === 'consultas' ? PX_FIELDS : MED_FIELDS
  const sections = tab === 'consultas' ? PX_SECTIONS : MED_SECTIONS
  const fetchList = tab === 'consultas' ? fetchReportesConsultas : fetchReportesMedicamentos
  const fetchOne = tab === 'consultas' ? fetchReporteConsulta : fetchReporteMedicamento
  const crear = tab === 'consultas' ? crearReporteConsulta : crearReporteMedicamento
  const actualizar = tab === 'consultas' ? actualizarReporteConsulta : actualizarReporteMedicamento
  const eliminar = tab === 'consultas' ? eliminarReporteConsulta : eliminarReporteMedicamento
  const exportarFn = tab === 'consultas' ? exportarReportesConsultas : exportarReportesMedicamentos

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

  useEffect(() => { if (subView === 'gestion') loadData() }, [loadData, subView])

  const totalPages = Math.ceil(total / pageSize)

  const stats = useMemo(() => {
    const s = { validados:0, borradores:0, con_errores:0, modificados:0 }
    data.forEach(r => { if (s[r.estado] !== undefined) s[r.estado]++ })
    return s
  }, [data])

  const handleExport = async () => {
    setDownloading(true)
    try {
      const blob = await exportarFn(filters)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = `Matriz_${tab==='consultas'?'PX_Consultas':'Medicamentos'}_${new Date().toISOString().slice(0,10)}.xlsx`
        a.click(); URL.revokeObjectURL(url)
      }
    } catch {}
    setDownloading(false)
  }

  const openCreate = (tipo) => { setTab(tipo); setEditing(null); setFormErrors([]); setFormValid(false); setFormOpen(true); setSubView('gestion') }
  const openEdit = async (id) => {
    try { const d = await fetchOne(id); setEditing(d); setFormErrors([]); setFormValid(d?.estado === 'validado'); setFormOpen(true) } catch {}
  }
  const openDetail = async (id) => {
    try { const d = await fetchOne(id); setDetailData(d); setDetailOpen(true) } catch {}
  }

  const handleSave = async (formData, status) => {
    setSaving(true)
    try {
      const res = status === 'borrador' ? await crear(formData) : await crear(formData)
      if (res?.errors?.length && status !== 'borrador') { setFormErrors(res.errors); setFormValid(false); setSaving(false); return }
      setFormOpen(false); setEditing(null); setFormErrors([]); loadData()
    } catch {}
    setSaving(false)
  }

  const handleUpdate = async (formData) => {
    setSaving(true)
    try {
      const res = await actualizar(editing.id, formData)
      if (res?.errors?.length) { setFormErrors(res.errors); setFormValid(false); setSaving(false); return }
      setFormOpen(false); setEditing(null); setFormErrors([]); loadData()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await eliminar(confirmDelete.id); setConfirmDelete(null); loadData() } catch {}
  }

  const pxCols = ['#','Registro','Periodo','EPS','Tipo doc','Documento','Orden','Municipio','Estado','Fecha','Acciones']
  const medCols = ['#','Registro','Periodo','EPS','Tipo doc','Documento','Prescripción','ATC','Estado','Fecha','Acciones']
  const colHeaders = tab === 'consultas' ? pxCols : medCols

  if (subView === 'menu') {
    return (
      <div className="fade-in" style={{ padding:'24px 32px', maxWidth:800 }}>
        <div className="page-title">Reporte de procedimientos o consultas pendientes</div>
        <div className="page-subtitle" style={{ marginBottom:24 }}>Captura, validación, almacenamiento, gestión y exportación de reportes pendientes</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom:20 }}>
          <div className="card-hover" style={{ cursor:'pointer' }} onClick={() => openCreate('consultas')}>
            <div style={{ fontSize:32, marginBottom:8 }}>&#128203;</div>
            <div style={{ fontWeight:600, fontSize:'0.95rem', color:'var(--text-primary)', marginBottom:4 }}>Consultas y procedimientos</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:12 }}>Reporte de procedimientos o consultas pendientes. 23 variables.</div>
            <span className="btn-primary text-sm">Diligenciar reporte</span>
          </div>
          <div className="card-hover" style={{ cursor:'pointer' }} onClick={() => openCreate('medicamentos')}>
            <div style={{ fontSize:32, marginBottom:8 }}>&#128138;</div>
            <div style={{ fontWeight:600, fontSize:'0.95rem', color:'var(--text-primary)', marginBottom:4 }}>Medicamentos</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:12 }}>Reporte de medicamentos pendientes. 28 variables.</div>
            <span className="btn-primary text-sm">Diligenciar reporte</span>
          </div>
        </div>
        <button className="btn-secondary text-sm" onClick={() => setSubView('gestion')}>Ir a Gestión de datos</button>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ padding:'24px 32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        <div>
          <div className="page-title">Reporte de procedimientos o consultas pendientes</div>
          <div className="page-subtitle">Gestión de datos</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-secondary text-sm" onClick={() => setSubView('menu')}>Nuevo reporte</button>
          <button className="btn-primary text-sm" onClick={() => { setEditing(null); setFormErrors([]); setFormValid(false); setFormOpen(true) }}>+ Crear registro</button>
        </div>
      </div>

      <div className="panel" style={{ padding:'4px', display:'inline-flex', gap:4, marginBottom:16 }}>
        {[{k:'consultas',l:'Consultas / Procedimientos'},{k:'medicamentos',l:'Medicamentos'}].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setPage(1); setSearch(''); setFilters({}) }}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${tab===t.k ? 'bg-white shadow-sm' : ''}`}
            style={{ color: tab===t.k ? 'var(--text-primary)' : 'var(--text-muted)', border:'none', cursor:'pointer', background: tab===t.k ? 'var(--bg-surface)' : 'transparent' }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:12 }}>
        <span className="badge-success">Validados: {stats.validados}</span>
        <span className="badge-neutral">Borradores: {stats.borradores}</span>
        <span className="badge-error">Con errores: {stats.con_errores}</span>
        <span className="badge-warning">Modificados: {stats.modificados}</span>
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', alignSelf:'center' }}>Total: {total}</span>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
        <input type="text" className="input text-sm" placeholder="Buscar por documento, consecutivo, orden, EPS..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ flex:1, minWidth:200 }} />
        <button className="btn-secondary text-sm" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>
        <button className="btn-secondary text-sm" onClick={handleExport} disabled={downloading}>
          {downloading ? 'Descargando...' : 'Descargar Excel'}
        </button>
      </div>

      {showFilters && (
        <div className="panel" style={{ marginBottom:12, padding:16 }}>
          <div className="section-label" style={{ marginBottom:10 }}>Filtros avanzados</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div><label className="form-label text-xs">Periodo</label><input className="input text-sm" value={filters.periodo||''} onChange={e => { setFilters({...filters,periodo:e.target.value}); setPage(1) }} /></div>
            <div><label className="form-label text-xs">EPS</label><input className="input text-sm" value={filters.eps||''} onChange={e => { setFilters({...filters,eps:e.target.value}); setPage(1) }} /></div>
            <div><label className="form-label text-xs">Tipo documento</label>
              <select className="input text-sm" value={filters.tipo_doc||''} onChange={e => { setFilters({...filters,tipo_doc:e.target.value}); setPage(1) }}>
                <option value="">Todos</option>
                {['MS','RC','TI','CC','CE','PA','CD','AS','CN','SC','PE','PT'].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><label className="form-label text-xs">Estado</label>
              <select className="input text-sm" value={filters.estado||''} onChange={e => { setFilters({...filters,estado:e.target.value}); setPage(1) }}>
                <option value="">Todos</option>
                {Object.entries(ESTADO_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="form-label text-xs">Municipio</label><input className="input text-sm" value={filters.municipio||''} onChange={e => { setFilters({...filters,municipio:e.target.value}); setPage(1) }} /></div>
            {tab==='consultas' && <div><label className="form-label text-xs">CUPS</label><input className="input text-sm" value={filters.cups||''} onChange={e => { setFilters({...filters,cups:e.target.value}); setPage(1) }} /></div>}
            {tab==='medicamentos' && <div><label className="form-label text-xs">ATC</label><input className="input text-sm" value={filters.atc||''} onChange={e => { setFilters({...filters,atc:e.target.value}); setPage(1) }} /></div>}
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <button className="btn-ghost text-sm" style={{ color:'var(--danger)' }} onClick={() => { setFilters({}); setPage(1) }}>Limpiar filtros</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel" style={{ padding:0, overflow:'hidden' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-subtle)' }}>
              {colHeaders.map(h => <th key={h} className="section-label text-left px-3 py-3" style={{ background:'var(--bg-subtle)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colHeaders.length} className="px-3 py-8 text-center text-sm" style={{ color:'var(--text-muted)' }}>Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={colHeaders.length} className="px-3 py-8 text-center text-sm" style={{ color:'var(--text-muted)' }}>No hay registros</td></tr>
            ) : data.map((r, i) => (
              <tr key={r.id} className="transition-colors hover:bg-[var(--bg-surface-hover)]" style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                <td className="px-3 py-2.5 text-xs">{(page-1)*pageSize + i + 1}</td>
                <td className="px-3 py-2.5 text-xs">{r.id}</td>
                <td className="px-3 py-2.5 text-xs">{r.periodo_reportado}</td>
                <td className="px-3 py-2.5 text-xs">{r.cod_eps}</td>
                <td className="px-3 py-2.5 text-xs">{r.tipo_documento}</td>
                <td className="px-3 py-2.5 text-xs font-medium">{r.documento}</td>
                <td className="px-3 py-2.5 text-xs">{tab==='consultas' ? r.identificador_orden : r.identificador_prescripcion}</td>
                {tab==='consultas' && <td className="px-3 py-2.5 text-xs">{r.cod_municipio}</td>}
                {tab==='medicamentos' && <td className="px-3 py-2.5 text-xs">{r.medicamento_atc}</td>}
                <td className="px-3 py-2.5"><span className={ESTADO_COLORS[r.estado]||'badge-neutral'}>{ESTADO_LABELS[r.estado]||r.estado}</span></td>
                <td className="px-3 py-2.5 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <button className="btn-ghost text-xs" style={{ padding:'4px 8px' }} onClick={() => openDetail(r.id)}>Ver</button>
                    <button className="btn-ghost text-xs" style={{ padding:'4px 8px' }} onClick={() => openEdit(r.id)}>Editar</button>
                    <button className="btn-ghost text-xs" style={{ padding:'4px 8px', color:'var(--danger)' }} onClick={() => setConfirmDelete(r)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs" style={{ color:'var(--text-secondary)', marginTop:12 }}>
          <span>Mostrando {(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} de {total}</span>
          <div className="flex gap-1">
            <button className="btn-secondary text-xs" onClick={() => setPage(Math.max(1,page-1))} disabled={page<=1}>Anterior</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,totalPages-4))+i; if(p>totalPages)return null; return <button key={p} onClick={()=>setPage(p)} className={`text-xs px-3 py-1 rounded-lg ${p===page?'btn-primary':'btn-secondary'}`}>{p}</button>})}
            <button className="btn-secondary text-xs" onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page>=totalPages}>Siguiente</button>
          </div>
        </div>
      )}

      {formOpen && <FormModal fields={fields} sections={sections} data={editing} errors={formErrors} valid={formValid} saving={saving} isEdit={!!editing}
        onSave={editing ? handleUpdate : handleSave} onClose={() => { setFormOpen(false); setEditing(null); setFormErrors([]) }} onValidate={setFormValid} />}

      {detailOpen && detailData && <DetailModal data={detailData} fields={fields} sections={sections}
        onClose={() => { setDetailOpen(false); setDetailData(null) }} onEdit={() => { setDetailOpen(false); openEdit(detailData.id) }} />}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Confirmar eliminación</div>
            <p className="modal-desc">¿Eliminar registro #{confirmDelete.id}? Esta acción realizará eliminación lógica.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary text-sm" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger text-sm" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormModal({ fields, sections, data, errors, valid, saving, isEdit, onSave, onClose, onValidate }) {
  const [formData, setFormData] = useState(() => {
    const d = {}; fields.forEach(f => { d[f.key] = data?.[f.key] || '' }); return d
  })
  const [openSections, setOpenSections] = useState(() => { const s = {}; sections.forEach((sec,i) => { s[sec.key] = i === 0 }); return s })
  const errMap = useMemo(() => buildErrorMap(errors), [errors])

  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))
  const toggleSection = key => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const handleValidate = () => {
    const fieldErrors = []
    fields.forEach(f => {
      if (f.required && (!formData[f.key] || String(formData[f.key]).trim() === '' || String(formData[f.key]).trim().toUpperCase() === 'SIN DATO')) {
        fieldErrors.push({ variable: f.label, dato: formData[f.key]||'vacío', error:'Campo obligatorio', debe_ser:'Valor válido', correccion:`Ingrese ${f.label.toLowerCase()}` })
      }
    })
    onValidate(fieldErrors.length === 0)
    return fieldErrors
  }

  const handleSaveDraft = () => onSave(formData, 'borrador')
  const handleSaveValidated = () => { if (handleValidate().length) return; onSave(formData, 'validado') }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{ marginBottom:16 }}>{isEdit ? 'Editar registro' : 'Nuevo registro'}</div>

        {errors.length > 0 && (
          <div className="px-4 py-3 rounded-lg text-sm flex items-start gap-3 mb-4"
            style={{ color:'#B91C1C', backgroundColor:'#FEE2E2', border:'1px solid #FECACA' }}>
            <div>
              <div className="font-semibold mb-1">Errores de validación:</div>
              {errors.map((e,i) => (
                <div key={i} className="text-xs" style={{ marginTop:2 }}>
                  <strong>{e.variable}:</strong> {e.error}. {e.correccion}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ maxHeight:'60vh', overflowY:'auto', paddingRight:4 }}>
          {sections.map(sec => (
            <div key={sec.key} className="panel" style={{ marginBottom:8, padding:0, overflow:'hidden' }}>
              <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background:'var(--bg-subtle)', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.8rem', color:'var(--text-primary)' }}
                onClick={() => toggleSection(sec.key)}>
                <span>{sec.title}</span>
                <span style={{ color:'var(--text-muted)', fontSize:16 }}>{openSections[sec.key] ? '−' : '+'}</span>
              </button>
              {openSections[sec.key] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                  {fields.filter(f => f.section === sec.key).map(f => (
                    <div key={f.key} className={f.key === 'observacion_causa' || f.key === 'procedimiento_consulta' || f.key === 'medicamento_nombre' ? 'sm:col-span-2' : ''}>
                      <label className="form-label text-xs">{f.label} {f.required && <span style={{ color:'var(--danger)' }}>*</span>}</label>
                      {f.type === 'select' ? (
                        <select className="input text-sm" value={formData[f.key]||''} onChange={e => handleChange(f.key, e.target.value)}>
                          <option value="">Seleccionar...</option>
                          {(f.options||[]).map(o => {
                            const v = typeof o === 'object' ? o.v : o
                            const l = typeof o === 'object' ? o.l : o
                            return <option key={v} value={v}>{l}</option>
                          })}
                        </select>
                      ) : (
                        <input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                          className="input text-sm" value={formData[f.key]||''} onChange={e => handleChange(f.key, e.target.value)} />
                      )}
                      {errMap[f.label] && <p className="text-xs mt-1" style={{ color:'var(--danger)' }}>{errMap[f.label].error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end" style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--border-subtle)' }}>
          <button className="btn-secondary text-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-secondary text-sm" onClick={handleSaveDraft} disabled={saving}>Guardar borrador</button>
          <button className="btn-primary text-sm" onClick={handleValidate} style={{ border:'1px solid var(--green-500)' }}>Validar registro</button>
          <button className={`btn text-sm ${valid ? 'btn-primary' : 'btn-secondary'}`} onClick={handleSaveValidated} disabled={saving || !valid}
            style={!valid ? { opacity:0.5, cursor:'not-allowed' } : {}}>
            {saving ? 'Guardando...' : 'Guardar registro'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ data, fields, sections, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{ marginBottom:4 }}>Registro #{data.id}</div>
        <span className={ESTADO_COLORS[data.estado]||'badge-neutral'} style={{ marginBottom:12, display:'inline-block' }}>{ESTADO_LABELS[data.estado]||data.estado}</span>

        <div style={{ maxHeight:'60vh', overflowY:'auto', paddingRight:4 }}>
          {sections.map(sec => (
            <div key={sec.key} style={{ marginBottom:12 }}>
              <div className="section-label" style={{ marginBottom:8, paddingBottom:6, borderBottom:'1px solid var(--border-subtle)' }}>{sec.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.filter(f => f.section === sec.key).map(f => (
                  <div key={f.key} className={f.key === 'observacion_causa' || f.key === 'procedimiento_consulta' || f.key === 'medicamento_nombre' ? 'sm:col-span-2' : ''}>
                    <div className="text-xs" style={{ color:'var(--text-muted)' }}>{f.label}</div>
                    <div className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{data[f.key] || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end" style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--border-subtle)' }}>
          <button className="btn-secondary text-sm" onClick={onClose}>Cerrar</button>
          <button className="btn-primary text-sm" onClick={onEdit}>Editar</button>
        </div>
      </div>
    </div>
  )
}
