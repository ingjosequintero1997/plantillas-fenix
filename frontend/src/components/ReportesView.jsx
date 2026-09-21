import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchReportesConsultas, fetchReporteConsulta, crearReporteConsulta, actualizarReporteConsulta,
  eliminarReporteConsulta, exportarReportesConsultas,
  fetchReportesMedicamentos, fetchReporteMedicamento, crearReporteMedicamento, actualizarReporteMedicamento,
  eliminarReporteMedicamento, exportarReportesMedicamentos,
} from '../api'

const PX_FIELDS = [
  { key:'consecutivo', label:'Consecutivo del registro', type:'number', required:true, section:'identificacion' },
  { key:'periodo_reportado', label:'PERIODO REPORTADO', type:'select', required:true, section:'identificacion',
    options:[{v:'1',l:'Periodo 1'},{v:'2',l:'Periodo 2'},{v:'3',l:'Periodo 3'},{v:'4',l:'Periodo 4'},{v:'5',l:'Periodo 5'},{v:'6',l:'Periodo 6'},{v:'7',l:'Periodo 7'},{v:'8',l:'Periodo 8'},{v:'9',l:'Periodo 9'},{v:'10',l:'Periodo 10'},{v:'11',l:'Periodo 11'},{v:'12',l:'Periodo 12'}] },
  { key:'cod_eps', label:'Cod. EPS', type:'text', required:true, section:'identificacion' },
  { key:'tipo_documento', label:'Tipo documento', type:'select', required:true, section:'identificacion',
    options:[{v:'CC',l:'Cédula de ciudadanía'},{v:'TI',l:'Tarjeta de identidad'},{v:'CE',l:'Cédula de extranjería'},{v:'RC',l:'Registro civil'},{v:'MS',l:'Menor sin documento'},{v:'PA',l:'Pasaporte'},{v:'CD',l:'Carné diplomático'},{v:'AS',l:'Adulto sin documento'},{v:'CN',l:'Certificado nacido vivo'},{v:'SC',l:'Salud cruzada'},{v:'PE',l:'Permiso especial'},{v:'PT',l:'Permiso por protección temporal'}] },
  { key:'documento', label:'Documento', type:'text', required:true, section:'identificacion' },
  { key:'identificador_orden', label:'Identificador de la orden de servicio', type:'text', required:true, section:'orden' },
  { key:'cod_municipio', label:'CÓDIGO MUNICIPIO', type:'text', required:true, section:'orden' },
  { key:'cod_diagnostico', label:'Código del Diagnóstico Principal', type:'text', required:true, section:'orden' },
  { key:'cups', label:'CUPS', type:'number', required:true, section:'orden' },
  { key:'procedimiento_consulta', label:'Procedimiento o consulta', type:'text', required:true, section:'orden' },
  { key:'clase_pendiente', label:'Clase de pendiente', type:'select', required:true, section:'orden',
    options:[{v:1,l:'1 - No direccionado y supera 3 días'},{v:2,l:'2 - Direccionado, no programado y supera 10 días'},{v:3,l:'3 - Programado pero no realizado'}] },
  { key:'cantidad_ordenada', label:'Cantidad ordenada', type:'number', required:true, section:'cantidades' },
  { key:'cantidad_prestacion_efectiva', label:'Cantidad con prestación efectiva', type:'number', required:true, section:'cantidades' },
  { key:'cantidad_pendiente', label:'Cantidad pendiente', type:'number', required:true, section:'cantidades' },
  { key:'causa_pendiente', label:'Causa del pendiente', type:'select', required:true, section:'causa',
    options:[{v:1,l:'1 - No programación'},{v:2,l:'2 - Restricción administrativa'},{v:3,l:'3 - Negación del usuario'},{v:4,l:'4 - Servicio no disponible en la IPS'},{v:5,l:'5 - Falta de talento humano'},{v:6,l:'6 - Falta de insumos'},{v:7,l:'7 - Afiliado no cobijado'},{v:8,l:'8 - Orden sin autorización'},{v:9,l:'9 - Incumplimiento de ruta'},{v:10,l:'10 - Traslado'},{v:11,l:'11 - Muerte'},{v:12,l:'12 - Mejoramiento y mantenimiento'},{v:13,l:'13 - Paro'},{v:14,l:'14 - Suspensión temporal'},{v:15,l:'15 - Otro'},{v:22,l:'22 - OTRA (requiere observación)'}] },
  { key:'observacion_causa', label:'Observación causa del pendiente', type:'text', required:false, section:'causa' },
  { key:'fecha_orden', label:'Fecha de orden', type:'date', required:true, section:'fechas' },
  { key:'fecha_pendiente', label:'Fecha del pendiente', type:'date', required:true, section:'fechas' },
  { key:'fecha_cierre', label:'Fecha de Cierre', type:'date', required:false, section:'fechas' },
  { key:'patologia', label:'Patologia/Condición clínica', type:'select', required:true, section:'adicional',
    options:['Asma','Cáncer','Diabetes','EPOC','HTA','Hemofilia','HT pulmonar','Enf. huérfana','Salud mental','Trasplante','VIH','Gestación','OTRA'] },
  { key:'mecanismo_financiacion', label:'MECANISMO DE FINANCIACIÓN', type:'select', required:true, section:'adicional',
    options:['UPC','Pmáx','Recobro'] },
  { key:'tutela', label:'Tutela', type:'select', required:true, section:'adicional', options:['SI','NO'] },
  { key:'identificacion_prestador', label:'Identificación del prestador de servicios de salud que genera el pendiente', type:'text', required:true, section:'adicional' },
]

const MED_FIELDS = [
  { key:'consecutivo', label:'Consecutivo del registro', type:'number', required:true, section:'identificacion' },
  { key:'periodo_reportado', label:'Periodo reportado', type:'select', required:true, section:'identificacion',
    options:[{v:'1',l:'Periodo 1'},{v:'2',l:'Periodo 2'},{v:'3',l:'Periodo 3'},{v:'4',l:'Periodo 4'},{v:'5',l:'Periodo 5'},{v:'6',l:'Periodo 6'},{v:'7',l:'Periodo 7'},{v:'8',l:'Periodo 8'},{v:'9',l:'Periodo 9'},{v:'10',l:'Periodo 10'},{v:'11',l:'Periodo 11'},{v:'12',l:'Periodo 12'}] },
  { key:'cod_eps', label:'Cod. EPS', type:'text', required:true, section:'identificacion' },
  { key:'tipo_documento', label:'Tipo documento', type:'select', required:true, section:'identificacion',
    options:[{v:'CC',l:'Cédula de ciudadanía'},{v:'TI',l:'Tarjeta de identidad'},{v:'CE',l:'Cédula de extranjería'},{v:'RC',l:'Registro civil'},{v:'MS',l:'Menor sin documento'},{v:'PA',l:'Pasaporte'},{v:'CD',l:'Carné diplomático'},{v:'AS',l:'Adulto sin documento'},{v:'CN',l:'Certificado nacido vivo'},{v:'SC',l:'Salud cruzada'},{v:'PE',l:'Permiso especial'},{v:'PT',l:'Permiso por protección temporal'}] },
  { key:'documento', label:'Documento', type:'text', required:true, section:'identificacion' },
  { key:'identificador_prescripcion', label:'Identificador de la prescripción', type:'text', required:true, section:'prescripcion' },
  { key:'cod_municipio', label:'CÓDIGO MUNICIPIO', type:'text', required:true, section:'prescripcion' },
  { key:'cod_diagnostico', label:'Código del Diagnóstico Principal', type:'text', required:true, section:'prescripcion' },
  { key:'medicamento_atc', label:'MEDICAMENTO - ATC', type:'text', required:true, section:'medicamento' },
  { key:'medicamento_concentracion', label:'MEDICAMENTO - CONCENTRACIÓN', type:'text', required:true, section:'medicamento' },
  { key:'medicamento_unidad', label:'MEDICAMENTO - UNIDAD DE CONCENTRACIÓN', type:'text', required:true, section:'medicamento' },
  { key:'forma_farmaceutica', label:'FORMA FARMACÉUTICA', type:'text', required:true, section:'medicamento' },
  { key:'medicamento_nombre', label:'MEDICAMENTO (Nombre comercial)', type:'text', required:true, section:'medicamento' },
  { key:'mecanismo_financiacion', label:'MECANISMO DE FINANCIACIÓN', type:'select', required:true, section:'cantidades',
    options:['UPC','Pmáx','Recobro'] },
  { key:'cantidad_prescrita', label:'Cantidad prescrita', type:'number', required:true, section:'cantidades' },
  { key:'dias_tratamiento', label:'Días de tratamiento', type:'number', required:true, section:'cantidades' },
  { key:'cantidad_dispensada', label:'Cantidad dispensada', type:'number', required:true, section:'cantidades' },
  { key:'cum_medicamento', label:'CUM del medicamento dispensado', type:'text', required:true, section:'cantidades' },
  { key:'cantidad_pendiente', label:'Cantidad pendiente', type:'number', required:true, section:'cantidades' },
  { key:'causa_pendiente', label:'Causa del pendiente', type:'select', required:true, section:'causa',
    options:[{v:1,l:'1 - No programación'},{v:2,l:'2 - Restricción administrativa'},{v:3,l:'3 - Negación del usuario'},{v:23,l:'23 - OTRA (requiere observación)'}] },
  { key:'observacion_causa', label:'Observación causa del pendiente', type:'text', required:false, section:'causa' },
  { key:'fecha_prescripcion', label:'Fecha prescripción', type:'date', required:true, section:'fechas' },
  { key:'fecha_pendiente', label:'Fecha pendiente', type:'date', required:true, section:'fechas' },
  { key:'fecha_cierre', label:'Fecha Cierre', type:'date', required:false, section:'fechas' },
  { key:'cantidad_dispensada_cierre', label:'Cantidad dispensada para el cierre del pendiente', type:'number', required:false, section:'fechas' },
  { key:'patologia', label:'Patologia/Condición clínica', type:'select', required:true, section:'adicional',
    options:['Asma','Cáncer','Diabetes','EPOC','HTA','Hemofilia','HT pulmonar','Enf. huérfana','Salud mental','Trasplante','VIH','Gestación','OTRA'] },
  { key:'identificacion_prestador', label:'Identificación del gestor farmacéutico o prestador de servicios de salud que genera el pendiente', type:'text', required:true, section:'adicional' },
  { key:'tutela', label:'Tutela', type:'select', required:true, section:'adicional', options:['SI','NO'] },
]

const PX_SECTIONS = [
  { key:'identificacion', title:'Identificación', icon:'person', count:5 },
  { key:'orden', title:'Orden / consulta', icon:'clipboard', count:6 },
  { key:'cantidades', title:'Cantidades', icon:'hashtag', count:3 },
  { key:'causa', title:'Causa del pendiente', icon:'warning', count:2 },
  { key:'fechas', title:'Fechas', icon:'calendar', count:3 },
  { key:'adicional', title:'Información adicional', icon:'info', count:4 },
]

const MED_SECTIONS = [
  { key:'identificacion', title:'Identificación', icon:'person', count:5 },
  { key:'prescripcion', title:'Prescripción', icon:'clipboard', count:3 },
  { key:'medicamento', title:'Medicamento', icon:'pill', count:5 },
  { key:'cantidades', title:'Cantidades y mecanismo', icon:'hashtag', count:6 },
  { key:'causa', title:'Causa del pendiente', icon:'warning', count:2 },
  { key:'fechas', title:'Fechas', icon:'calendar', count:4 },
  { key:'adicional', title:'Información adicional', icon:'info', count:3 },
]

const SECTION_ICONS = {
  person: '👤',
  clipboard: '📋',
  hashtag: '#',
  warning: '⚠️',
  calendar: '📅',
  info: 'ℹ️',
  pill: '💊',
}

const ESTADO_COLORS = { borrador:'#6b7280', con_errores:'#dc2626', validado:'#16a34a', modificado:'#d97706' }
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
  const [formView, setFormView] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formErrors, setFormErrors] = useState([])
  const [formValid, setFormValid] = useState(false)
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

  const openCreate = (tipo) => { setTab(tipo); setEditing(null); setFormErrors([]); setFormValid(false); setFormView('create'); setSubView('gestion') }
  const openEdit = async (id) => {
    try { const d = await fetchOne(id); setEditing(d); setFormErrors([]); setFormValid(d?.estado === 'validado'); setFormView('edit') } catch {}
  }
  const openDetail = async (id) => {
    try { const d = await fetchOne(id); setDetailData(d); setFormView('detail') } catch {}
  }

  const handleSave = async (formData, showToast) => {
    setSaving(true)
    try {
      const res = await crear(formData)
      if (showToast) {
        if (res?.errors?.length) {
          setFormErrors(res.errors)
          showToast(`Registro guardado con ${res.errors.length} error(es) de validación`, 'warning')
        } else {
          showToast('Registro guardado exitosamente', 'success')
        }
      }
      setFormErrors(res?.errors || [])
      setTimeout(() => { setFormView(null); setEditing(null); setFormErrors([]); loadData() }, 800)
    } catch (e) { if (showToast) showToast('Error al guardar: ' + (e.message || 'Intente de nuevo'), 'error') }
    setSaving(false)
  }

  const handleUpdate = async (formData, showToast) => {
    setSaving(true)
    try {
      const res = await actualizar(editing.id, formData)
      if (showToast) {
        if (res?.errors?.length) {
          setFormErrors(res.errors)
          showToast(`Registro actualizado con ${res.errors.length} error(es) de validación`, 'warning')
        } else {
          showToast('Registro actualizado exitosamente', 'success')
        }
      }
      setFormErrors(res?.errors || [])
      setTimeout(() => { setFormView(null); setEditing(null); setFormErrors([]); loadData() }, 800)
    } catch (e) { if (showToast) showToast('Error al actualizar: ' + (e.message || 'Intente de nuevo'), 'error') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await eliminar(confirmDelete.id); setConfirmDelete(null); loadData() } catch {}
  }

  const pxCols = ['#','Registro','Periodo','EPS','Tipo doc','Documento','Orden','Municipio','Estado','Fecha','Acciones']
  const medCols = ['#','Registro','Periodo','EPS','Tipo doc','Documento','Prescripción','ATC','Estado','Fecha','Acciones']
  const colHeaders = tab === 'consultas' ? pxCols : medCols

  if (formView === 'create' || formView === 'edit') {
    return <FormPage fields={fields} sections={sections} data={editing} errors={formErrors} valid={formValid}
      saving={saving} isEdit={formView === 'edit'} tab={tab}
      onSave={formView === 'edit' ? handleUpdate : handleSave}
      onCancel={() => { setFormView(null); setEditing(null); setFormErrors([]) }}
      onValidate={setFormValid} />
  }

  if (formView === 'detail' && detailData) {
    return <DetailPage data={detailData} fields={fields} sections={sections} tab={tab}
      onClose={() => { setFormView(null); setDetailData(null) }}
      onEdit={() => { const d = detailData; setDetailData(null); openEdit(d.id) }} />
  }

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
          <button className="btn-primary text-sm" onClick={() => { setEditing(null); setFormErrors([]); setFormValid(false); setFormView('create') }}>+ Crear registro</button>
        </div>
      </div>

      <div className="panel" style={{ padding:'4px', display:'inline-flex', gap:4, marginBottom:16 }}>
        {[{k:'consultas',l:'Consultas / Procedimientos'},{k:'medicamentos',l:'Medicamentos'}].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setPage(1); setSearch(''); setFilters({}) }}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ color: tab===t.k ? 'var(--text-primary)' : 'var(--text-muted)', border:'none', cursor:'pointer', background: tab===t.k ? 'var(--bg-surface)' : 'transparent', boxShadow: tab===t.k ? 'var(--shadow-xs)' : 'none' }}>
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
                <td className="px-3 py-2.5"><span className={ESTADO_COLORS[r.estado]||'badge-neutral'} style={{ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:'0.7rem', fontWeight:500, background:(ESTADO_COLORS[r.estado]||'#6b7280')+'18', color:ESTADO_COLORS[r.estado]||'#6b7280' }}>{ESTADO_LABELS[r.estado]||r.estado}</span></td>
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

function validateField(f, val) {
  const v = val === undefined || val === null ? '' : String(val).trim()
  if (f.required && (v === '' || v.toUpperCase() === 'SIN DATO')) {
    return { variable: f.label, error: 'Campo obligatorio', correccion: `Ingrese ${f.label.toLowerCase()}` }
  }
  if (v === '') return null
  const lower = f.label.toLowerCase()
  if (f.type === 'number') {
    if (isNaN(Number(v))) return { variable: f.label, error: 'debe ser numérico', correccion: `Ingrese solo números para ${lower}` }
  } else if (f.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { variable: f.label, error: 'formato de fecha inválido', correccion: `Use formato AAAA-MM-DD para ${lower}` }
  } else if (f.type === 'select' && Array.isArray(f.options)) {
    const allowed = f.options.map(o => (typeof o === 'object' ? String(o.v) : String(o)).toUpperCase())
    if (!allowed.includes(v.toUpperCase())) {
      const list = f.options.map(o => (typeof o === 'object' ? o.l : o)).join(', ')
      return { variable: f.label, error: 'valor no está en las opciones permitidas', correccion: `Seleccione una opción válida de: ${list}` }
    }
  }
  if (f.length && String(v).length !== f.length) {
    return { variable: f.label, error: `longitud ${String(v).length} no coincide`, correccion: `Debe tener exactamente ${f.length} caracteres` }
  }
  return null
}

function FormPage({ fields, sections, data, errors, valid, saving, isEdit, tab, onSave, onCancel, onValidate }) {
  const [formData, setFormData] = useState(() => {
    const d = {}; fields.forEach(f => { d[f.key] = data?.[f.key] || '' }); return d
  })
  const [liveErrors, setLiveErrors] = useState({})
  const [touched, setTouched] = useState({})
  const errMap = useMemo(() => buildErrorMap(errors), [errors])
  const [toast, setToast] = useState(null)

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const handleChange = (key, val) => {
    setFormData(prev => {
      const next = { ...prev, [key]: val }
      const f = fields.find(x => x.key === key)
      if (f) {
        const err = validateField(f, val)
        setLiveErrors(prevE => ({ ...prevE, [key]: err }))
      }
      setTouched(t => ({ ...t, [key]: true }))
      return next
    })
  }

  const requiredFields = useMemo(() => fields.filter(f => f.required), [fields])
  const filledCount = useMemo(() => requiredFields.filter(f => {
    const v = formData[f.key]
    return v !== '' && v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim().toUpperCase() !== 'SIN DATO'
  }).length, [formData, requiredFields])
  const progress = requiredFields.length > 0 ? Math.round((filledCount / requiredFields.length) * 100) : 0

  const liveErrorList = useMemo(() => Object.values(liveErrors).filter(Boolean), [liveErrors])

  const handleValidate = () => {
    const fieldErrors = []
    fields.forEach(f => {
      if (f.required) {
        const err = validateField(f, formData[f.key])
        if (err) fieldErrors.push(err)
      }
    })
    setLiveErrors(prev => {
      const next = { ...prev }
      fields.forEach(f => {
        const err = validateField(f, formData[f.key])
        next[f.key] = err
      })
      return next
    })
    onValidate(fieldErrors.length === 0)
    if (fieldErrors.length === 0) {
      showToast('Validación exitosa — todos los campos obligatorios completados', 'success')
    } else {
      showToast(`${fieldErrors.length} campo(s) con errores`, 'error')
    }
    return fieldErrors
  }

  const handleSubmit = () => {
    const errs = handleValidate()
    if (errs.length) return
    onSave(formData, showToast)
  }

  const totalRequired = requiredFields.length

  return (
    <div className="fade-in" style={{ maxWidth:1200, margin:'0 auto' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:8,
          background: toast.type === 'success' ? 'var(--green-50)' : toast.type === 'warning' ? '#fffbeb' : '#fef2f2',
          color: toast.type === 'success' ? 'var(--green-700)' : toast.type === 'warning' ? '#b45309' : 'var(--danger)',
          border: `1px solid ${toast.type === 'success' ? 'var(--green-300)' : toast.type === 'warning' ? '#f59e0b' : 'var(--danger)'}`,
          boxShadow:'0 4px 12px rgba(0,0,0,0.15)', fontSize:'0.85rem', fontWeight:500 }}>
          {toast.type === 'success' ? '\u2713 ' : '\u2717 '}{toast.msg}
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:4 }}>
          {isEdit ? `Registro #${data?.id}` : 'Nuevo registro'} · {tab === 'consultas' ? 'MATRIZ PX Y CONSULTAS' : 'MATRIZ MEDICAMENTOS'}
        </div>
      </div>

      <div className="panel" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text-primary)' }}>Campos obligatorios</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{filledCount} de {totalRequired} completados</div>
        </div>
        <div style={{ width:'100%', height:8, borderRadius:4, background:'var(--bg-subtle)', overflow:'hidden' }}>
          <div style={{ width:`${progress}%`, height:'100%', borderRadius:4, background: progress === 100 ? 'var(--green-500)' : 'var(--green-400)', transition:'width 300ms ease' }} />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="panel" style={{ marginBottom:16, borderColor:'var(--danger)', background:'var(--danger-bg)' }}>
          <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--danger)', marginBottom:4 }}>Errores de validación (servidor)</div>
          {errors.map((e,i) => (
            <div key={i} style={{ fontSize:'0.8rem', color:'var(--danger)', marginTop:2 }}>
              <strong>{e.variable}:</strong> {e.error}. {e.correccion}
            </div>
          ))}
        </div>
      )}

      {liveErrorList.length > 0 && (
        <div className="panel" style={{ marginBottom:16, borderColor:'#f59e0b', background:'#fffbeb' }}>
          <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#b45309', marginBottom:4 }}>Errores en el formulario ({liveErrorList.length})</div>
          {liveErrorList.slice(0, 8).map((e,i) => (
            <div key={i} style={{ fontSize:'0.8rem', color:'#b45309', marginTop:2 }}>
              <strong>{e.variable}:</strong> {e.error}. {e.correccion}
            </div>
          ))}
          {liveErrorList.length > 8 && <div style={{ fontSize:'0.8rem', color:'#b45309', marginTop:2 }}>Y {liveErrorList.length - 8} más...</div>}
        </div>
      )}

      {sections.map(sec => {
        const sectionFields = fields.filter(f => f.section === sec.key)
        const sectionFilled = sectionFields.filter(f => {
          if (!f.required) return true
          const v = formData[f.key]
          return v !== '' && v !== null && v !== undefined && String(v).trim() !== ''
        }).length
        return (
          <div key={sec.key} className="panel" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--green-50)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'var(--green-600)' }}>
                {SECTION_ICONS[sec.icon]}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--text-primary)' }}>{sec.title}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{sectionFields.length} campos</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionFields.map(f => {
                const liveErr = liveErrors[f.key]
                const showErr = touched[f.key] && liveErr
                return (
                <div key={f.key} className={f.key === 'observacion_causa' || f.key === 'identificacion_prestador' || f.key === 'medicamento_nombre' ? 'sm:col-span-2 lg:col-span-3' : ''}>
                  <label className="form-label text-xs">
                    {f.label} {f.required && <span style={{ color:'var(--danger)' }}>*</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select className="input text-sm" value={formData[f.key]||''} onChange={e => handleChange(f.key, e.target.value)}
                      style={showErr ? { borderColor:'var(--danger)', borderWidth:2 } : undefined}>
                      <option value="">Seleccionar...</option>
                      {(f.options||[]).map(o => {
                        const v = typeof o === 'object' ? o.v : o
                        const l = typeof o === 'object' ? o.l : o
                        return <option key={v} value={v}>{l}</option>
                      })}
                    </select>
                  ) : (
                    <input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                      className="input text-sm" value={formData[f.key]||''} onChange={e => handleChange(f.key, e.target.value)}
                      style={showErr ? { borderColor:'var(--danger)', borderWidth:2 } : undefined} />
                  )}
                  {showErr && <p className="text-xs mt-1" style={{ color:'var(--danger)' }}>{liveErr.error}. {liveErr.correccion}</p>}
                  {!showErr && errMap[f.label] && <p className="text-xs mt-1" style={{ color:'var(--danger)' }}>{errMap[f.label].error}</p>}
                </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'16px 0', borderTop:'1px solid var(--border-subtle)', marginTop:8, position:'sticky', bottom:0, background:'var(--bg-canvas)', zIndex:10 }}>
        <button className="btn-secondary text-sm" onClick={onCancel}>Cancelar</button>
        <button className="btn-primary text-sm" onClick={handleValidate} style={{ border:'1px solid var(--green-500)' }}>Validar registro</button>
        <button className="btn text-sm" onClick={handleSubmit} disabled={saving}
          style={{ background:'var(--green-600)', color:'#fff', border:'1px solid var(--green-600)' }}>
          {saving ? 'Guardando...' : isEdit ? 'Actualizar registro' : 'Guardar registro'}
        </button>
      </div>
    </div>
  )
}

function DetailPage({ data, fields, sections, tab, onClose, onEdit }) {
  return (
    <div className="fade-in" style={{ maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:4 }}>
            Registro #{data.id} · {tab === 'consultas' ? 'MATRIZ PX Y CONSULTAS' : 'MATRIZ MEDICAMENTOS'}
          </div>
          <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:'0.7rem', fontWeight:500,
            background:(ESTADO_COLORS[data.estado]||'#6b7280')+'18', color:ESTADO_COLORS[data.estado]||'#6b7280' }}>
            {ESTADO_LABELS[data.estado]||data.estado}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={onClose}>Volver</button>
          <button className="btn-primary text-sm" onClick={onEdit}>Editar</button>
        </div>
      </div>

      {sections.map(sec => {
        const sectionFields = fields.filter(f => f.section === sec.key)
        return (
          <div key={sec.key} className="panel" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--green-50)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'var(--green-600)' }}>
                {SECTION_ICONS[sec.icon]}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--text-primary)' }}>{sec.title}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{sectionFields.length} campos</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionFields.map(f => (
                <div key={f.key} className={f.key === 'observacion_causa' || f.key === 'identificacion_prestador' || f.key === 'medicamento_nombre' ? 'sm:col-span-2 lg:col-span-3' : ''}>
                  <div className="text-xs" style={{ color:'var(--text-muted)' }}>{f.label}</div>
                  <div className="text-sm font-medium" style={{ color:'var(--text-primary)', marginTop:2 }}>{data[f.key] || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'16px 0' }}>
        <button className="btn-secondary text-sm" onClick={onClose}>Volver</button>
        <button className="btn-primary text-sm" onClick={onEdit}>Editar</button>
      </div>
    </div>
  )
}
