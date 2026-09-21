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
  { key:'cod_municipio', label:'CÓDIGO MUNICIPIO', type:'text', required:true, section:'orden', pattern:'^\d{5}$' },
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
  { key:'cod_municipio', label:'CÓDIGO MUNICIPIO', type:'text', required:true, section:'prescripcion', pattern:'^\d{5}$' },
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

const ESTADO_COLORS = { borrador:'#6b7280', con_errores:'#dc2626', validado:'#16a34a', modificado:'#d97706' }
const ESTADO_LABELS = { borrador:'Borrador', con_errores:'Con errores', validado:'Validado', modificado:'Modificado' }

const CSS = {
  page: { display:'flex', flexDirection:'column', gap:16, padding:'16px 24px', fontFamily:'var(--font-body)' },
  title: { fontSize:'1.125rem', fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)', margin:0 },
  subtitle: { fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 },
  card: { background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:12, padding:24, cursor:'pointer', transition:'all 150ms' },
  cardTitle: { fontSize:'0.95rem', fontWeight:600, color:'var(--text-primary)', marginBottom:4 },
  cardDesc: { fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:12 },
  btn: { padding:'8px 20px', borderRadius:8, fontSize:'0.8rem', fontWeight:500, border:'none', cursor:'pointer', transition:'all 150ms' },
  input: { width:'100%', padding:'8px 12px', borderRadius:8, fontSize:'0.8rem', border:'1px solid var(--border-subtle)', background:'var(--bg-surface)', color:'var(--text-primary)', outline:'none', transition:'border-color 150ms' },
  label: { fontSize:'0.75rem', fontWeight:500, color:'var(--text-secondary)', marginBottom:4, display:'block' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' },
  th: { padding:'10px 12px', textAlign:'left', fontSize:'0.7rem', fontWeight:600, color:'var(--text-secondary)', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-subtle)' },
  td: { padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)', color:'var(--text-primary)' },
  badge: (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:'0.7rem', fontWeight:500, background:color+'18', color }),
  sectionAccordion: { border:'1px solid var(--border-subtle)', borderRadius:8, overflow:'hidden', marginBottom:8 },
  sectionHeader: { padding:'12px 16px', background:'var(--bg-subtle)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)', userSelect:'none' },
  sectionBody: { padding:'16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  modalOverlay: { position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:32, overflowY:'auto', background:'rgba(0,0,0,0.45)' },
  modal: { background:'var(--bg-surface)', borderRadius:14, width:'100%', maxWidth:800, marginBottom:32, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { padding:'16px 20px', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  modalBody: { padding:20, maxHeight:'65vh', overflowY:'auto' },
  modalFooter: { padding:'12px 20px', borderTop:'1px solid var(--border-subtle)', display:'flex', justifyContent:'flex-end', gap:8 },
}

function StatBadge({ label, value, color }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-secondary)' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:color }} />
      {label}: <strong style={{ color:'var(--text-primary)' }}>{value}</strong>
    </span>
  )
}

function FieldInput({ field, value, onChange, error }) {
  const style = { ...CSS.input, borderColor: error ? 'var(--danger)' : 'var(--border-subtle)' }
  if (field.type === 'select') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} style={style}>
        <option value="">Seleccionar...</option>
        {(field.options || []).map(o => {
          const v = typeof o === 'object' ? o.v : o
          const l = typeof o === 'object' ? o.l : o
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
    )
  }
  return (
    <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
      value={value || ''} onChange={e => onChange(field.key, e.target.value)}
      placeholder="" style={style} />
  )
}

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
      const blob = await exportar(filters)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        const tipo = tab === 'consultas' ? 'PX_Consultas' : 'Medicamentos'
        a.download = `Matriz_${tipo}_${new Date().toISOString().slice(0,10)}.xlsx`
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
      <div style={CSS.page}>
        <div>
          <h1 style={CSS.title}>Reporte de procedimientos o consultas pendientes</h1>
          <p style={CSS.subtitle}>Captura, validación, almacenamiento, gestión y exportación de reportes pendientes</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:700 }}>
          <div style={CSS.card} onClick={() => setTab('consultas')} onMouseEnter={e => e.currentTarget.style.borderColor='var(--green-400)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-subtle)'}>
            <div style={{ fontSize:28, marginBottom:8 }}>&#128203;</div>
            <div style={CSS.cardTitle}>Consultas y procedimientos</div>
            <div style={CSS.cardDesc}>Reporte de procedimientos o consultas pendientes. 23 variables.</div>
            <button style={{ ...CSS.btn, background:'var(--action-primary)', color:'#fff' }} onClick={(e) => { e.stopPropagation(); openCreate('consultas') }}>
              Diligenciar reporte
            </button>
          </div>
          <div style={CSS.card} onClick={() => setTab('medicamentos')} onMouseEnter={e => e.currentTarget.style.borderColor='var(--green-400)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-subtle)'}>
            <div style={{ fontSize:28, marginBottom:8 }}>&#128138;</div>
            <div style={CSS.cardTitle}>Medicamentos</div>
            <div style={CSS.cardDesc}>Reporte de medicamentos pendientes. 28 variables.</div>
            <button style={{ ...CSS.btn, background:'var(--action-primary)', color:'#fff' }} onClick={(e) => { e.stopPropagation(); openCreate('medicamentos') }}>
              Diligenciar reporte
            </button>
          </div>
        </div>
        <button onClick={() => setSubView('gestion')} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)', alignSelf:'flex-start', marginTop:8 }}>
          Ir a Gestión de datos
        </button>
      </div>
    )
  }

  return (
    <div style={CSS.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={CSS.title}>Reporte de procedimientos o consultas pendientes</h1>
          <p style={CSS.subtitle}>Gestión de datos</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setSubView('menu')} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>Nuevo reporte</button>
          <button onClick={() => openCreate(tab)} style={{ ...CSS.btn, background:'var(--action-primary)', color:'#fff' }}>+ Crear registro</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, padding:4, background:'var(--bg-subtle)', borderRadius:8 }}>
        {[{k:'consultas',l:'Consultas / Procedimientos'},{k:'medicamentos',l:'Medicamentos'}].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setPage(1); setSearch(''); setFilters({}) }}
            style={{ flex:1, padding:'8px 12px', borderRadius:6, fontSize:'0.8rem', fontWeight:500, border:'none', cursor:'pointer',
              background: tab===t.k ? 'var(--bg-surface)' : 'transparent', color: tab===t.k ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab===t.k ? 'var(--shadow-xs)' : 'none', transition:'all 150ms' }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <StatBadge label="Validados" value={stats.validados} color="#16a34a" />
        <StatBadge label="Borradores" value={stats.borradores} color="#6b7280" />
        <StatBadge label="Con errores" value={stats.con_errores} color="#dc2626" />
        <StatBadge label="Modificados" value={stats.modificados} color="#d97706" />
        <StatBadge label="Total" value={total} color="var(--brand-strong)" />
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <input type="text" placeholder="Buscar por documento, consecutivo, orden, EPS..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ ...CSS.input, flex:1, minWidth:200 }} />
        <button onClick={() => setShowFilters(!showFilters)}
          style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>
          {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>
        <button onClick={handleExport} disabled={downloading}
          style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>
          {downloading ? 'Descargando...' : 'Descargar Excel'}
        </button>
      </div>

      {showFilters && (
        <div style={{ padding:16, borderRadius:8, border:'1px solid var(--border-subtle)', background:'var(--bg-subtle)', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
          <div><label style={CSS.label}>Periodo</label><input value={filters.periodo||''} onChange={e => { setFilters({...filters,periodo:e.target.value}); setPage(1) }} style={CSS.input} /></div>
          <div><label style={CSS.label}>EPS</label><input value={filters.eps||''} onChange={e => { setFilters({...filters,eps:e.target.value}); setPage(1) }} style={CSS.input} /></div>
          <div><label style={CSS.label}>Tipo documento</label>
            <select value={filters.tipo_doc||''} onChange={e => { setFilters({...filters,tipo_doc:e.target.value}); setPage(1) }} style={CSS.input}>
              <option value="">Todos</option>
              {['MS','RC','TI','CC','CE','PA','CD','AS','CN','SC','PE','PT'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={CSS.label}>Estado</label>
            <select value={filters.estado||''} onChange={e => { setFilters({...filters,estado:e.target.value}); setPage(1) }} style={CSS.input}>
              <option value="">Todos</option>
              {Object.entries(ESTADO_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label style={CSS.label}>Municipio</label><input value={filters.municipio||''} onChange={e => { setFilters({...filters,municipio:e.target.value}); setPage(1) }} style={CSS.input} /></div>
          {tab==='consultas' && <div><label style={CSS.label}>CUPS</label><input value={filters.cups||''} onChange={e => { setFilters({...filters,cups:e.target.value}); setPage(1) }} style={CSS.input} /></div>}
          {tab==='medicamentos' && <div><label style={CSS.label}>ATC</label><input value={filters.atc||''} onChange={e => { setFilters({...filters,atc:e.target.value}); setPage(1) }} style={CSS.input} /></div>}
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <button onClick={() => { setFilters({}); setPage(1) }} style={{ ...CSS.btn, color:'var(--danger)', background:'transparent' }}>Limpiar</button>
          </div>
        </div>
      )}

      <div style={{ borderRadius:8, border:'1px solid var(--border-subtle)', overflow:'hidden' }}>
        <table style={CSS.table}>
          <thead>
            <tr>{colHeaders.map(h => <th key={h} style={CSS.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colHeaders.length} style={{ ...CSS.td, textAlign:'center', padding:32, color:'var(--text-muted)' }}>Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={colHeaders.length} style={{ ...CSS.td, textAlign:'center', padding:32, color:'var(--text-muted)' }}>No hay registros</td></tr>
            ) : data.map((r, i) => (
              <tr key={r.id} style={{ transition:'background 100ms' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={CSS.td}>{(page-1)*pageSize + i + 1}</td>
                <td style={CSS.td}>{r.id}</td>
                <td style={CSS.td}>{r.periodo_reportado}</td>
                <td style={CSS.td}>{r.cod_eps}</td>
                <td style={CSS.td}>{r.tipo_documento}</td>
                <td style={CSS.td}>{r.documento}</td>
                <td style={CSS.td}>{tab==='consultas' ? r.identificador_orden : r.identificador_prescripcion}</td>
                {tab==='consultas' && <td style={CSS.td}>{r.cod_municipio}</td>}
                {tab==='medicamentos' && <td style={CSS.td}>{r.medicamento_atc}</td>}
                <td style={CSS.td}><span style={CSS.badge(ESTADO_COLORS[r.estado]||'#6b7280')}>{ESTADO_LABELS[r.estado]||r.estado}</span></td>
                <td style={CSS.td}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                <td style={CSS.td}>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => openDetail(r.id)} style={{ ...CSS.btn, background:'transparent', color:'var(--brand-strong)', padding:'4px 8px', fontSize:'0.7rem' }}>Ver</button>
                    <button onClick={() => openEdit(r.id)} style={{ ...CSS.btn, background:'transparent', color:'var(--action-primary)', padding:'4px 8px', fontSize:'0.7rem' }}>Editar</button>
                    <button onClick={() => setConfirmDelete(r)} style={{ ...CSS.btn, background:'transparent', color:'var(--danger)', padding:'4px 8px', fontSize:'0.7rem' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
          <span>Mostrando {(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} de {total}</span>
          <div style={{ display:'flex', gap:4 }}>
            <button onClick={() => setPage(Math.max(1,page-1))} disabled={page<=1} style={{ ...CSS.btn, border:'1px solid var(--border-subtle)', background:'var(--bg-surface)' }}>Anterior</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,totalPages-4))+i; if(p>totalPages)return null; return <button key={p} onClick={()=>setPage(p)} style={{ ...CSS.btn, border:p===page?'2px solid var(--brand-strong)':'1px solid var(--border-subtle)', background:p===page?'var(--surface-brand-weak)':'var(--bg-surface)' }}>{p}</button>})}
            <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page>=totalPages} style={{ ...CSS.btn, border:'1px solid var(--border-subtle)', background:'var(--bg-surface)' }}>Siguiente</button>
          </div>
        </div>
      )}

      {formOpen && <FormModal fields={fields} sections={sections} data={editing} errors={formErrors} valid={formValid} saving={saving} isEdit={!!editing}
        onSave={editing ? handleUpdate : handleSave} onClose={() => { setFormOpen(false); setEditing(null); setFormErrors([]) }} onValidate={setFormValid} />}

      {detailOpen && detailData && <DetailModal data={detailData} fields={fields} sections={sections}
        onClose={() => { setDetailOpen(false); setDetailData(null) }} onEdit={() => { setDetailOpen(false); openEdit(detailData.id) }} />}

      {confirmDelete && (
        <div style={CSS.modalOverlay}>
          <div style={{ ...CSS.modal, maxWidth:400 }}>
            <div style={{ padding:20 }}>
              <h3 style={{ ...CSS.title, marginBottom:8 }}>Confirmar eliminación</h3>
              <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:16 }}>
                ¿Eliminar registro #{confirmDelete.id}? Esta acción realizará eliminación lógica.
              </p>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={() => setConfirmDelete(null)} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>Cancelar</button>
                <button onClick={handleDelete} style={{ ...CSS.btn, background:'var(--danger)', color:'#fff' }}>Eliminar</button>
              </div>
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
  const [touched, setTouched] = useState({})
  const errMap = useMemo(() => buildErrorMap(errors), [errors])

  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }))
    setTouched(prev => ({ ...prev, [key]: true }))
  }
  const toggleSection = key => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const handleValidate = () => {
    const fieldErrors = []
    fields.forEach(f => {
      if (f.required && (!formData[f.key] || String(formData[f.key]).trim() === '' || String(formData[f.key]).trim().toUpperCase() === 'SIN DATO')) {
        fieldErrors.push({ variable: f.label, dato: formData[f.key]||'vacío', error:'Campo obligatorio', debe_ser:'Valor válido', correccion:`Ingrese ${f.label.toLowerCase()}` })
      }
    })
    const hasErrors = fieldErrors.length > 0
    onValidate(!hasErrors)
    return fieldErrors
  }

  const handleSaveDraft = () => onSave(formData, 'borrador')

  const handleSaveValidated = () => {
    const errs = handleValidate()
    if (errs.length) return
    onSave(formData, 'validado')
  }

  return (
    <div style={CSS.modalOverlay} onClick={onClose}>
      <div style={CSS.modal} onClick={e => e.stopPropagation()}>
        <div style={CSS.modalHeader}>
          <h2 style={CSS.title}>{isEdit ? 'Editar registro' : 'Nuevo registro'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>&#10005;</button>
        </div>
        <div style={CSS.modalBody}>
          {errors.length > 0 && (
            <div style={{ padding:12, borderRadius:8, border:'1px solid var(--danger)', background:'var(--danger-bg)', marginBottom:12 }}>
              <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--danger)', marginBottom:4 }}>Errores de validación:</p>
              {errors.map((e,i) => (
                <p key={i} style={{ fontSize:'0.75rem', color:'var(--danger)', margin:'2px 0' }}>
                  <strong>{e.variable}:</strong> {e.error}. {e.correccion}
                </p>
              ))}
            </div>
          )}
          {sections.map(sec => (
            <div key={sec.key} style={CSS.sectionAccordion}>
              <div style={CSS.sectionHeader} onClick={() => toggleSection(sec.key)}>
                <span>{sec.title}</span>
                <span style={{ color:'var(--text-muted)' }}>{openSections[sec.key] ? '−' : '+'}</span>
              </div>
              {openSections[sec.key] && (
                <div style={CSS.sectionBody}>
                  {fields.filter(f => f.section === sec.key).map(f => (
                    <div key={f.key} style={{ gridColumn: (f.type === 'text' && f.key.includes('observacion')) || f.key.includes('procedimiento') || f.key.includes('nombre') ? 'span 2' : 'span 1' }}>
                      <label style={CSS.label}>{f.label} {f.required && <span style={{ color:'var(--danger)' }}>*</span>}</label>
                      <FieldInput field={f} value={formData[f.key]} onChange={handleChange} error={errMap[f.label]} />
                      {errMap[f.label] && <p style={{ fontSize:'0.7rem', color:'var(--danger)', marginTop:2 }}>{errMap[f.label].error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={CSS.modalFooter}>
          <button onClick={onClose} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSaveDraft} disabled={saving} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>Guardar borrador</button>
          <button onClick={handleValidate} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--brand-strong)', color:'var(--brand-strong)' }}>Validar registro</button>
          <button onClick={handleSaveValidated} disabled={saving || !valid} style={{ ...CSS.btn, background: valid ? 'var(--action-primary)' : 'var(--bg-subtle)', color: valid ? '#fff' : 'var(--text-muted)', cursor: valid ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Guardando...' : 'Guardar registro'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ data, fields, sections, onClose, onEdit }) {
  return (
    <div style={CSS.modalOverlay} onClick={onClose}>
      <div style={CSS.modal} onClick={e => e.stopPropagation()}>
        <div style={CSS.modalHeader}>
          <h2 style={CSS.title}>Registro #{data.id}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>&#10005;</button>
        </div>
        <div style={CSS.modalBody}>
          <div style={{ marginBottom:12 }}>
            <span style={CSS.badge(ESTADO_COLORS[data.estado]||'#6b7280')}>{ESTADO_LABELS[data.estado]||data.estado}</span>
          </div>
          {sections.map(sec => (
            <div key={sec.key} style={{ marginBottom:12 }}>
              <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)', padding:'8px 0', borderBottom:'1px solid var(--border-subtle)', marginBottom:8 }}>{sec.title}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {fields.filter(f => f.section === sec.key).map(f => (
                  <div key={f.key} style={{ gridColumn: (f.type === 'text' && f.key.includes('observacion')) || f.key.includes('procedimiento') || f.key.includes('nombre') ? 'span 2' : 'span 1' }}>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{f.label}</div>
                    <div style={{ fontSize:'0.8rem', fontWeight:500, color:'var(--text-primary)' }}>{data[f.key] || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={CSS.modalFooter}>
          <button onClick={onClose} style={{ ...CSS.btn, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>Cerrar</button>
          <button onClick={onEdit} style={{ ...CSS.btn, background:'var(--action-primary)', color:'#fff' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}
