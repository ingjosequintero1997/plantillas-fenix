import React, { useEffect, useState, useMemo } from 'react'
import { fetchGestantes, updateGestante, createGestante, fetchMyPermissions, autoFillCasoCerrado, fetchCasoCerrado } from '../api'

const PAGE_SIZE = 50

// Campos clave para mostrar en la tabla resumen
const TABLE_COLS = [
  { key: 'NO_DE_IDENTIFICACION', label: 'Documento' },
  { key: 'APELLIDO_1', label: 'Apellido 1' },
  { key: 'NOMBRE_1', label: 'Nombre 1' },
  { key: 'FECHA_DE_NACIMIENTO', label: 'Nacimiento' },
  { key: 'EDAD', label: 'Edad' },
  { key: 'NOMBRE_DE_LA_IPS_PRIMARIA', label: 'IPS' },
]

// Campos del formulario de edición (grupos)
const FORM_SECTIONS = [
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
]

export default function DataManagement() {
  const [registros, setRegistros] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // registro object or null
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [permissions, setPermissions] = useState({})
  const [activeTab, setActiveTab] = useState('gestantes') // 'gestantes' | 'caso_cerrado'
  const [casoCerradoRegistros, setCasoCerradoRegistros] = useState([])
  const [casoCerradoTotal, setCasoCerradoTotal] = useState(0)
  const [casoCerradoPage, setCasoCerradoPage] = useState(1)
  const [autoFillDone, setAutoFillDone] = useState(false)
  const [autoFillMsg, setAutoFillMsg] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = async () => {
    setLoading(true); setError('')
    try {
      const data = await fetchGestantes(page, PAGE_SIZE, search)
      setRegistros(data.registros || [])
      setTotal(data.total || 0)
      if (data.error) setError(data.error)
    } catch (e) {
      setError(e.message || 'No se pudo cargar la data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    fetchMyPermissions().then(d => setPermissions(d.permissions || {})).catch(() => {})
  }, [])

  const handleSearch = () => { setPage(1); load() }

  const handleAutoFillCasoCerrado = async () => {
    try {
      const data = await autoFillCasoCerrado()
      setAutoFillMsg(`Caso Cerrado auto-llenado: ${data.total_caso_cerrado} registros marcados`)
      setAutoFillDone(true)
      loadCasoCerrado(1)
      setTimeout(() => setAutoFillMsg(''), 5000)
    } catch (e) {
      setAutoFillMsg('Error: ' + (e.message || 'No se pudo auto-llenar'))
    }
  }

  const loadCasoCerrado = async (p = 1) => {
    try {
      const data = await fetchCasoCerrado(p, PAGE_SIZE)
      setCasoCerradoRegistros(data.registros || [])
      setCasoCerradoTotal(data.total || 0)
      setCasoCerradoPage(p)
    } catch (e) {}
  }

  const startEdit = (reg) => {
    setEditing(reg)
    setForm({ ...reg })
    setMsg('')
  }

  const handleFormChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const saveEdit = async () => {
    setSaving(true); setMsg('')
    try {
      await updateGestante(editing.id, form)
      setMsg('Guardado correctamente')
      setEditing(null)
      load()
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
      load()
    } catch (e) {
      throw e
    }
  }

  if (editing) {
    return (
      <EditForm
        form={form}
        onChange={handleFormChange}
        onSave={saveEdit}
        onClose={() => setEditing(null)}
        saving={saving}
        msg={msg}
      />
    )
  }

  if (showNewForm) {
    return (
      <NewGestanteForm
        onSave={handleCreate}
        onClose={() => setShowNewForm(false)}
        permissions={permissions}
      />
    )
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title">Gestión de data</div>
          <div className="page-subtitle">Visualiza y edita los registros de gestantes del sistema.</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nuevo registro
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

      {/* Tabs */}
      <div className="flex gap-1">
        <button onClick={() => setActiveTab('gestantes')} className="px-3 py-1.5 text-sm rounded-md" style={{ backgroundColor: activeTab === 'gestantes' ? 'var(--primary)' : 'var(--bg-secondary)', color: activeTab === 'gestantes' ? 'white' : 'var(--text)' }}>
          Registros ({total})
        </button>
        <button onClick={() => { setActiveTab('caso_cerrado'); loadCasoCerrado(1) }} className="px-3 py-1.5 text-sm rounded-md" style={{ backgroundColor: activeTab === 'caso_cerrado' ? 'var(--primary)' : 'var(--bg-secondary)', color: activeTab === 'caso_cerrado' ? 'white' : 'var(--text)' }}>
          Caso Cerrado ({casoCerradoTotal})
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
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{total} registros</span>
      </div>

      {/* Tabla */}
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
          <div className="empty-desc">No se encontraron gestantes con los filtros actuales.</div>
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
                    <td key={col.key} className="text-sm max-w-[150px] truncate">
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
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary px-2.5 py-1 text-xs">← Anterior</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary px-2.5 py-1 text-xs">Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido del tab Caso Cerrado */}
      {activeTab === 'caso_cerrado' && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Caso Cerrado</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gestantes que cumplen los criterios de caso cerrado (10 meses de evolución, último control prenatal previo al reporte, y fecha de parto o aborto registradas).</div>
            </div>
          </div>

          {casoCerradoRegistros.length === 0 && !loading ? (
            <div className="empty">
              <div className="empty-icon">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="empty-title">Sin casos cerrados</div>
              <div className="empty-desc">Usa el botón "Auto-fill Caso Cerrado" para marcar automáticamente los casos que cumplen los criterios.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center">#</th>
                    <th>Documento</th>
                    <th>Apellido 1</th>
                    <th>Nombre 1</th>
                    <th>IPS</th>
                    <th>Últ. Control</th>
                    <th>F. Parto</th>
                  </tr>
                </thead>
                <tbody>
                  {casoCerradoRegistros.map((reg, i) => (
                    <tr key={reg.id}>
                      <td className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {(casoCerradoPage - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="text-sm">{reg.NO_DE_IDENTIFICACION || '—'}</td>
                      <td className="text-sm">{reg.APELLIDO_1 || '—'}</td>
                      <td className="text-sm">{reg.NOMBRE_1 || '—'}</td>
                      <td className="text-sm">{reg.NOMBRE_DE_LA_IPS_PRIMARIA || '—'}</td>
                      <td className="text-sm">{reg.ULTIMO_CONTROL_PRENATAL || '—'}</td>
                      <td className="text-sm">{reg.FECHA_DE_PARTO || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Math.ceil(casoCerradoTotal / PAGE_SIZE) > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Página {casoCerradoPage} de {Math.ceil(casoCerradoTotal / PAGE_SIZE)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => loadCasoCerrado(casoCerradoPage - 1)} disabled={casoCerradoPage <= 1} className="btn-secondary px-2.5 py-1 text-xs">←</button>
                    <button onClick={() => loadCasoCerrado(casoCerradoPage + 1)} disabled={casoCerradoPage >= Math.ceil(casoCerradoTotal / PAGE_SIZE)} className="btn-secondary px-2.5 py-1 text-xs">→</button>
                  </div>
                </div>
              )}
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
            Editar gestante — {form.NO_DE_IDENTIFICACION || ''}
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {FORM_SECTIONS.map((sec, i) => (
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

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
        {FORM_SECTIONS[activeSection].fields.map((field) => (
          <div key={field}>
            <label className="form-label text-xs">{field.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</label>
            <input
              value={form[field] || ''}
              onChange={(e) => onChange(field, e.target.value)}
              className="input text-sm"
              placeholder=""
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
    if (!form.NO_DE_IDENTIFICACION) { setError('El número de documento es obligatorio'); return }
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
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Registra una gestante individual (un registro a la vez).</div>
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
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="RC">Registro Civil</option>
              <option value="PT">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="form-label">Número de documento *</label>
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
            <label className="form-label">Fecha diagnóstico embarazo</label>
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
