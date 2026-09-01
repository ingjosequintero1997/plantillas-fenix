import React, { useEffect, useState, useMemo } from 'react'
import { fetchIpsGrupos, fetchGestantes, updateGestante, createGestante, autoFillCasoCerrado, fetchCasoCerrado, populateGestantes } from '../api'

const PAGE_SIZE = 50

const TABLE_COLS = [
  { key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', label: 'Tipo Doc' },
  { key: 'NO_DE_IDENTIFICACION', label: 'Documento' },
  { key: 'APELLIDO_1', label: 'Apellido 1' },
  { key: 'APELLIDO_2', label: 'Apellido 2' },
  { key: 'NOMBRE_1', label: 'Nombre 1' },
  { key: 'NOMBRE_2', label: 'Nombre 2' },
  { key: 'FECHA_DE_NACIMIENTO', label: 'Nacimiento' },
  { key: 'EDAD', label: 'Edad' },
  { key: 'SEXO', label: 'Sexo' },
  { key: 'FECHA_DE_DIAGNOSTICO', label: 'F. Diagnóstico' },
  { key: 'FUM', label: 'FUM' },
  { key: 'ULTIMO_CONTROL_PRENATAL', label: 'Últ. Control' },
  { key: 'FECHA_DE_PARTO', label: 'F. Parto' },
  { key: 'CASO_CERRADO', label: 'Caso Cerrado' },
]

const EDIT_SECTIONS = [
  {
    titulo: 'Datos personales',
    fields: [
      'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', 'NO_DE_IDENTIFICACION', 'APELLIDO_1', 'APELLIDO_2',
      'NOMBRE_1', 'NOMBRE_2', 'FECHA_DE_NACIMIENTO', 'EDAD', 'SEXO',
      'REGIMEN_DE_AFILIACION', 'PERTENECIA_ETNICA', 'GRUPO_POBLACIONAL',
      'DEPARTAMENTO_DE_RESIDENCIA', 'MUNICIPIO_DE_RESIDENCIA', 'ZONA', 'ETNIA',
      'TELEFONO_USUARIA', 'DIRECCION', 'NIVEL_EDUCATIVO', 'DISCAPACIDAD',
      'MUJER_CABEZA_DE_HOGAR', 'OCUPACION', 'ESTADO_CIVIL',
    ],
  },
  {
    titulo: 'Control prenatal',
    fields: [
      'CONTROL_TRADICIONAL', 'GESTANTE_RENUENTE', 'INASISTENTE',
      'NOMBRE_DE_LA_IPS_PRIMARIA', 'FECHA_DE_DIAGNOSTICO',
      'FECHA_DE_INGRESO_AL_CONTROL_PRENATAL', 'FUM', 'FPP',
      'DIAS_PARA_EL_PARTO', 'ALARMA', 'EDAD_GEST_INICIO_CONTROL', 'TRIMESTRE_INICIO_CONTROL',
    ],
  },
  {
    titulo: 'Antecedentes obstétricos',
    fields: [
      'G', 'P', 'C', 'A', 'M', 'V',
      'HIPERTENSION_ARTERIAL', 'DIABETES', 'VIH', 'SIFILIS', 'TUBERCULOSIS',
      'OTRAS_CONDICIONES_MEDICAS_GRAVES',
      'ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES', 'PERIODO_INTERGENESICO',
      'PESO_INICIAL_KG', 'TALLA_METROS', 'INDICE_DE_MASA_CORPORAL_IMC',
      'CLASIFICACION_DE_IMC', 'APOYO_FAMILIAR', 'EMBARAZO_DESEADO',
      'HABITOS_DE_RIESGO',
    ],
  },
  {
    titulo: 'Tamizajes',
    fields: [
      'ASESORIA_PRUEBA_VIH', 'TRIMESTRE_ASESORIA_VIH',
      'FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE', 'RESULTADO_PRIMER_TAMIZAJE_PRUEBA_DE_VIH',
      'FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE', 'RESULTADO_SEGUNDO_TAMIZAJE_PRUEBA_DE_VIH',
      'FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE', 'RESULTADO_TERCER_TAMIZAJE_PRUEBA_DE_VIH',
      'FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', 'RESULTADO_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS',
      'FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', 'RESULTADO_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS',
      'FECHA_DE_DIAGNOSTICO_DE_SIFILIS', 'TRATAMIENTO_INSTAURADO',
    ],
  },
  {
    titulo: 'Controles y controles',
    fields: [
      'FECHA_1ER_CONTROL', 'QUIEN_REALIZO_EL_CONTROL',
      'FECHA_2DO_CONTROL', 'QUIEN_REALIZO_EL_CONTROL_2',
      'FECHA_3ER_CONTROL', 'QUIEN_REALIZO_EL_CONTROL_3',
      'FECHA_4TO_CONTROL', 'QUIEN_REALIZO_EL_CONTROL_4',
      'FECHA_5TO_CONTROL', 'QUIEN_REALIZO_EL_CONTROL_5',
      'NUMERO_TOTAL_DE_CONTROLES_PRENATALES', 'ULTIMO_CONTROL_PRENATAL',
      'EDAD_GESTACIONAL_ACTUAL', 'PESO_ACTUAL', 'TALLA_ACTUAL', 'IMC', 'TA_ACTUAL',
    ],
  },
  {
    titulo: 'Eventos obstétricos',
    fields: [
      'TIPO_DE_ABORTO', 'FECHA', 'SEMANAS_DE_GESTACION', 'COMPLICACIONES',
      'FECHA_DE_PARTO', 'CARACTERISTICAS_DEL_PARTO', 'PARTO_ATENDIDO_POR',
      'NO_SEMANAS_DE_GESTACION', 'COMPLICACIONES_DURANTE_EL_PARTO',
      'TIPO_COMPLICACION', 'UCI_MATERNA', 'TOMA_DE_PRUEBAS_ITS_INTRAPARTO',
      'MULTIPLICIDAD_DEL_EMBARAZO', 'CASO_CERRADO', 'OBSERVACIONES_GENERALES',
    ],
  },
]

export default function DataManagement() {
  const [view, setView] = useState('ips_list') // 'ips_list' | 'ips_detail' | 'editing'
  const [ipsGroups, setIpsGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedIps, setSelectedIps] = useState(null)
  const [registros, setRegistros] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [activeTab, setActiveTab] = useState('gestantes')
  const [casoCerradoRegistros, setCasoCerradoRegistros] = useState([])
  const [casoCerradoTotal, setCasoCerradoTotal] = useState(0)
  const [autoFillMsg, setAutoFillMsg] = useState('')
  const [populating, setPopulating] = useState(false)
  const [populateMsg, setPopulateMsg] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadIpsGroups = async () => {
    setLoading(true); setError('')
    try {
      const data = await fetchIpsGrupos()
      setIpsGroups(data.ips || [])
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las IPS')
    } finally {
      setLoading(false)
    }
  }

  const loadGestantes = async (ipsName = '', p = 1, q = '') => {
    setLoading(true); setError('')
    try {
      const data = await fetchGestantes(p, PAGE_SIZE, q, ipsName)
      setRegistros(data.registros || [])
      setTotal(data.total || 0)
      if (data.error) setError(data.error)
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los registros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIpsGroups() }, [])

  const handleSelectIps = (ips) => {
    setSelectedIps(ips)
    setPage(1)
    setSearch('')
    setView('ips_detail')
    loadGestantes(ips.nombre, 1, '')
  }

  const handleBack = () => {
    setView('ips_list')
    setSelectedIps(null)
    setRegistros([])
    setTotal(0)
    setPage(1)
    loadIpsGroups()
  }

  const handleSearch = () => {
    setPage(1)
    loadGestantes(selectedIps?.nombre || '', 1, search)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadGestantes(selectedIps?.nombre || '', newPage, search)
  }

  const startEdit = (reg) => {
    setEditing(reg)
    setForm({ ...reg })
    setMsg('')
    setView('editing')
  }

  const handleFormChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const saveEdit = async () => {
    setSaving(true); setMsg('')
    try {
      await updateGestante(editing.id, form)
      setMsg('Guardado correctamente')
      setEditing(null)
      setView('ips_detail')
      loadGestantes(selectedIps?.nombre || '', page, search)
    } catch (e) {
      setMsg('Error: ' + (e.message || 'No se pudo guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (data) => {
    try {
      await createGestante(data)
      setShowNewForm(false)
      setView('ips_detail')
      loadGestantes(selectedIps?.nombre || '', page, search)
    } catch (e) {
      throw e
    }
  }

  const handleAutoFillCasoCerrado = async () => {
    try {
      const data = await autoFillCasoCerrado()
      setAutoFillMsg(`Caso Cerrado auto-llenado: ${data.total_caso_cerrado} registros marcados`)
      setTimeout(() => setAutoFillMsg(''), 5000)
    } catch (e) {
      setAutoFillMsg('Error: ' + (e.message || 'No se pudo auto-llenar'))
    }
  }

  const handlePopulate = async () => {
    setPopulating(true); setPopulateMsg('Procesando...')
    try {
      const raw = sessionStorage.getItem('auth')
      const token = raw ? JSON.parse(raw).token : ''
      const resp = await fetch('/api/data/gestantes/populate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const text = await resp.text()
      let data
      try { data = JSON.parse(text) } catch { data = { error: text.slice(0, 300) } }
      if (data.error) {
        setPopulateMsg('Error: ' + data.error)
      } else {
        const errCount = data.errores ? data.errores.length : 0
        const primerError = errCount > 0 ? ` | Error: ${data.errores[0]}` : ''
        const dbg = data.debug ? ` | debug: ${data.debug.cols_en_primera_linea} cols/texto, ${data.debug.real_cols_count} cols/tabla, ${data.debug.cols_validas_count} match` : ''
        setPopulateMsg(`${data.insertadas} gestantes de ${data.total_lineas} lineas (cargue #${data.cargue_id})${primerError}${dbg}`)
        loadIpsGroups()
      }
    } catch (e) {
      setPopulateMsg('Error fetch: ' + (e.message || 'No se pudo poblar'))
    } finally {
      setPopulating(false)
    }
  }

  const loadCasoCerrado = async (p = 1) => {
    try {
      const data = await fetchCasoCerrado(p, PAGE_SIZE)
      setCasoCerradoRegistros(data.registros || [])
      setCasoCerradoTotal(data.total || 0)
    } catch (e) {}
  }

  // ─── Edit view ────────────────────────────────────────────
  if (view === 'editing' && editing) {
    return <EditForm form={form} onChange={handleFormChange} onSave={saveEdit}
      onClose={() => { setEditing(null); setView('ips_detail') }} saving={saving} msg={msg} />
  }

  // ─── New gestante form ────────────────────────────────────
  if (showNewForm) {
    return <NewGestanteForm onSave={handleCreate} onClose={() => setShowNewForm(false)} />
  }

  // ─── IPS List view ────────────────────────────────────────
  if (view === 'ips_list') {
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Gestión de data</div>
            <div className="page-subtitle">Selecciona una IPS para ver y gestionar las gestantes.</div>
          </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePopulate} disabled={populating} className="btn-secondary text-sm" style={{ borderColor: '#e74c3c', color: '#e74c3c' }}>
            {populating ? 'Poblando...' : 'Poblar data desde cargues'}
          </button>
          <button onClick={handleAutoFillCasoCerrado} className="btn-secondary text-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Auto-fill Caso Cerrado
          </button>
        </div>
        </div>

        {autoFillMsg && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: autoFillMsg.includes('Error') ? 'var(--error)' : 'var(--primary)', backgroundColor: autoFillMsg.includes('Error') ? '#FBE9E9' : '#EEF3F7' }}>{autoFillMsg}</div>
        )}

        {populateMsg && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: populateMsg.includes('Error') ? 'var(--error)' : 'var(--success, #27ae60)', backgroundColor: populateMsg.includes('Error') ? '#FBE9E9' : '#E8F8F0' }}>{populateMsg}</div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
        )}

        {loading ? (
          <div className="skeleton h-40 w-full rounded-xl" />
        ) : ipsGroups.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="empty-title">Sin datos</div>
            <div className="empty-desc">No hay registros de gestantes en el sistema. Sube un cargue desde "Validar data" primero.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ipsGroups.map((item) => (
              <button
                key={item.nombre}
                onClick={() => handleSelectIps(item)}
                className="panel text-left hover:shadow-md transition-shadow"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.nombre}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.total} gestantes</div>
                  </div>
                  <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── IPS Detail view (list of gestantes for one IPS) ──────
  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="btn-ghost text-sm px-2 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="page-title">{selectedIps?.nombre || 'IPS'}</div>
            <div className="page-subtitle">{total} gestantes registradas</div>
          </div>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo registro
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por documento, apellido o nombre..."
            className="input pl-9"
          />
        </div>
        <button onClick={handleSearch} className="btn-secondary text-sm">Buscar</button>
      </div>

      {loading ? (
        <div className="skeleton h-40 w-full rounded-xl" />
      ) : registros.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="empty-title">Sin registros</div>
          <div className="empty-desc">No se encontraron gestantes para esta IPS.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center">#</th>
                {TABLE_COLS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg, i) => (
                <tr key={reg.id}>
                  <td className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  {TABLE_COLS.map((col) => (
                    <td key={col.key} className="text-sm max-w-[120px] truncate">
                      {reg[col.key] || '—'}
                    </td>
                  ))}
                  <td className="text-right">
                    <button onClick={() => startEdit(reg)} className="btn-ghost text-xs px-2 py-1" title="Editar">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Página {page} de {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary px-2.5 py-1 text-xs">← Anterior</button>
                <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary px-2.5 py-1 text-xs">Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


function EditForm({ form, onChange, onSave, onClose, saving, msg }) {
  const [activeSection, setActiveSection] = useState(0)

  return (
    <div className="panel fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Editar — {form.NO_DE_IDENTIFICACION || ''}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {form.APELLIDO_1} {form.APELLIDO_2} {form.NOMBRE_1} {form.NOMBRE_2}
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {EDIT_SECTIONS.map((sec, i) => (
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            className="px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors"
            style={{
              backgroundColor: activeSection === i ? 'var(--primary)' : 'var(--bg-secondary)',
              color: activeSection === i ? 'white' : 'var(--text)',
            }}
          >
            {sec.titulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
        {EDIT_SECTIONS[activeSection].fields.map((field) => (
          <div key={field}>
            <label className="form-label text-xs">{field.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</label>
            <input
              value={form[field] || ''}
              onChange={(e) => onChange(field, e.target.value)}
              className="input text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-sm" style={{ color: msg.includes('Error') ? 'var(--error)' : 'var(--primary)' }}>{msg}</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button onClick={onSave} className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}


function NewGestanteForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    TIPO_DE_DOCUMENTO_DE_IDENTIDAD: 'CC',
    NO_DE_IDENTIFICACION: '',
    APELLIDO_1: '',
    APELLIDO_2: '',
    NOMBRE_1: '',
    NOMBRE_2: '',
    FECHA_DE_NACIMIENTO: '',
    EDAD: '',
    SEXO: '1',
    NOMBRE_DE_LA_IPS_PRIMARIA: '',
    FECHA_DE_DIAGNOSTICO: '',
    FUM: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.NO_DE_IDENTIFICACION) { setError('El numero de documento es obligatorio'); return }
    if (!form.APELLIDO_1) { setError('El primer apellido es obligatorio'); return }
    if (!form.NOMBRE_1) { setError('El primer nombre es obligatorio'); return }
    setSaving(true); setError('')
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Nuevo registro de gestante</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Registra una gestante individual.</div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Tipo de documento *</label>
            <select value={form.TIPO_DE_DOCUMENTO_DE_IDENTIDAD} onChange={(e) => handleChange('TIPO_DE_DOCUMENTO_DE_IDENTIDAD', e.target.value)} className="input">
              <option value="CC">Cedula de Ciudadania</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="RC">Registro Civil</option>
              <option value="PT">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="form-label">Numero de documento *</label>
            <input value={form.NO_DE_IDENTIFICACION} onChange={(e) => handleChange('NO_DE_IDENTIFICACION', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">IPS Primaria</label>
            <input value={form.NOMBRE_DE_LA_IPS_PRIMARIA} onChange={(e) => handleChange('NOMBRE_DE_LA_IPS_PRIMARIA', e.target.value)} className="input" placeholder="Nombre de la IPS" />
          </div>
          <div>
            <label className="form-label">Primer apellido *</label>
            <input value={form.APELLIDO_1} onChange={(e) => handleChange('APELLIDO_1', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">Segundo apellido</label>
            <input value={form.APELLIDO_2} onChange={(e) => handleChange('APELLIDO_2', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">Primer nombre *</label>
            <input value={form.NOMBRE_1} onChange={(e) => handleChange('NOMBRE_1', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">Segundo nombre</label>
            <input value={form.NOMBRE_2} onChange={(e) => handleChange('NOMBRE_2', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">Fecha de nacimiento</label>
            <input type="date" value={form.FECHA_DE_NACIMIENTO} onChange={(e) => handleChange('FECHA_DE_NACIMIENTO', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">Edad</label>
            <input value={form.EDAD} onChange={(e) => handleChange('EDAD', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">Fecha diagnostico embarazo</label>
            <input type="date" value={form.FECHA_DE_DIAGNOSTICO} onChange={(e) => handleChange('FECHA_DE_DIAGNOSTICO', e.target.value)} className="input" />
          </div>
          <div>
            <label className="form-label">FUM</label>
            <input type="date" value={form.FUM} onChange={(e) => handleChange('FUM', e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear registro'}
          </button>
        </div>
      </form>
    </div>
  )
}
