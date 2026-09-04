import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchIpsGrupos, fetchGestantes, updateGestante, createGestante, autoFillCasoCerrado, populateGestantes, cleanAndRepopulate, validateAffiliation } from '../api'
import GestanteForm from './GestanteForm'

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

const INST_COLS = [
  { key: 'tipo_id', label: 'Tipo ID' },
  { key: 'numero_id', label: 'Número' },
  { key: 'apellido1', label: 'Apellido 1' },
  { key: 'apellido2', label: 'Apellido 2' },
  { key: 'nombre1', label: 'Nombre 1' },
  { key: 'nombre2', label: 'Nombre 2' },
]

export default function DataManagement({ institutionalData, correctedText }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [view, setView] = useState('ips_list')
  const [ipsGroups, setIpsGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedIps, setSelectedIps] = useState(null)
  const [registros, setRegistros] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [autoFillMsg, setAutoFillMsg] = useState('')
  const [populating, setPopulating] = useState(false)
  const [populateMsg, setPopulateMsg] = useState('')
  const [instValidating, setInstValidating] = useState(false)
  const [instResult, setInstResult] = useState(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const useInst = institutionalData && institutionalData.ips_groups && Object.keys(institutionalData.ips_groups).length > 0

  const loadIpsGroups = async () => {
    setLoading(true); setError('')
    try {
      const data = await fetchIpsGrupos()
      if (!data) { setError('Respuesta vacía del servidor'); setIpsGroups([]); return }
      if (data.error) { setError(data.error); setIpsGroups([]); return }
      setIpsGroups(data.ips || [])
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las IPS')
      setIpsGroups([])
    } finally { setLoading(false) }
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
    } finally { setLoading(false) }
  }

  useEffect(() => { if (!useInst) loadIpsGroups() }, [useInst])

  const handleSelectIps = (ipsName) => {
    setSelectedIps(ipsName)
    setPage(1); setSearch('')
    setView('ips_detail')
    if (!useInst) loadGestantes(ipsName, 1, '')
  }

  const handleBack = () => {
    setView('ips_list'); setSelectedIps(null); setRegistros([]); setTotal(0); setPage(1)
    if (!useInst) loadIpsGroups()
  }

  const handleSearch = () => {
    setPage(1)
    if (!useInst) loadGestantes(selectedIps || '', 1, search)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    if (!useInst) loadGestantes(selectedIps || '', newPage, search)
  }

  const startEdit = (reg) => { setEditing(reg); setView('editing') }

  const handleSaveEdit = async (data) => {
    await updateGestante(editing.id, data)
    setEditing(null); setView('ips_detail')
    loadGestantes(selectedIps || '', page, search)
  }

  const handleCreate = async (data) => {
    await createGestante(data)
    setShowNewForm(false); setView('ips_detail')
    loadGestantes(selectedIps || '', page, search)
  }

  const handleAutoFillCasoCerrado = async () => {
    try {
      const data = await autoFillCasoCerrado()
      setAutoFillMsg(`Caso Cerrado auto-llenado: ${data.total_caso_cerrado} registros`)
      setTimeout(() => setAutoFillMsg(''), 5000)
    } catch (e) { setAutoFillMsg('Error: ' + (e.message || 'No se pudo auto-llenar')) }
  }

  const handlePopulate = async () => {
    setPopulating(true); setPopulateMsg('Limpiando y re-poblando...')
    try {
      const data = await cleanAndRepopulate()
      if (data.error) { setPopulateMsg('Error: ' + data.error) }
      else {
        const d = data.diagnostico || {}
        setPopulateMsg(`${data.insertadas} gestantes insertadas. Headers mapeados: ${d.total_mapped}/${d.total_headers_csv}`)
        loadIpsGroups()
      }
    } catch (e) { setPopulateMsg('Error: ' + (e.message || 'No se pudo re-poblar')) }
    finally { setPopulating(false) }
  }

  const handleValidateAffiliation = async () => {
    if (!correctedText) { setInstResult({ error: 'No hay datos cargados. Sube un archivo primero.' }); return }
    setInstValidating(true); setInstResult(null)
    try {
      const data = await validateAffiliation(correctedText)
      setInstResult(data)
    } catch (e) { setInstResult({ error: e.message || 'Error validando afiliación' }) }
    finally { setInstValidating(false) }
  }

  const instIpsGroups = useInst ? institutionalData.ips_groups : (instResult?.ips_groups || {})
  const instIpsNames = Object.keys(instIpsGroups)
  const instNoEncontrados = useInst ? (institutionalData.no_encontrados || 0) : (instResult?.no_encontrados || 0)
  const instErrors = useInst ? (institutionalData.errors || []) : (instResult?.errors || [])
  const instEncontrados = useInst ? (institutionalData.encontrados || 0) : (instResult?.encontrados || 0)

  if (view === 'editing' && editing) {
    return <GestanteForm mode="edit" initialData={editing} onSave={handleSaveEdit}
      onClose={() => { setEditing(null); setView('ips_detail') }} />
  }

  if (view === 'ips_detail' && showNewForm) {
    return <GestanteForm mode="create" onSave={handleCreate}
      onClose={() => setShowNewForm(false)}
      initialData={{ NOMBRE_DE_LA_IPS_PRIMARIA: selectedIps || '' }} />
  }

  if (view === 'ips_list') {
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Gestión de data</div>
            <div className="page-subtitle">
              {useInst ? `${instIpsNames.length} IPS institucionales · ${instEncontrados} afiliadas` : `${ipsGroups.length} IPS en BD`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleValidateAffiliation} disabled={instValidating || !correctedText}
              className="btn-primary text-sm">
              {instValidating ? 'Validando...' : 'Validar Afiliación'}
            </button>
            {isAdmin && !useInst && (
              <>
                <button onClick={handlePopulate} disabled={populating} className="btn-secondary text-sm" style={{ borderColor: '#e74c3c', color: '#e74c3c' }}>
                  {populating ? 'Re-poblando...' : 'Re-poblar data'}
                </button>
                <button onClick={handleAutoFillCasoCerrado} className="btn-secondary text-sm">Auto-fill Caso Cerrado</button>
              </>
            )}
          </div>
        </div>

        {autoFillMsg && <div className="px-3 py-2 rounded-md text-sm" style={{ color: autoFillMsg.includes('Error') ? 'var(--error)' : 'var(--primary)', backgroundColor: autoFillMsg.includes('Error') ? '#FBE9E9' : '#EEF3F7' }}>{autoFillMsg}</div>}
        {populateMsg && <div className="px-3 py-2 rounded-md text-sm" style={{ color: populateMsg.includes('Error') ? 'var(--error)' : 'var(--text-secondary)', backgroundColor: populateMsg.includes('Error') ? '#FBE9E9' : '#F0F0F0', whiteSpace: 'pre-wrap' }}>{populateMsg}</div>}
        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}
        {instResult?.error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{instResult.error}</div>}

        {instNoEncontrados > 0 && (
          <div className="px-3 py-2 rounded-md text-xs" style={{ color: '#e67e22', backgroundColor: '#FEF3E2' }}>
            {instNoEncontrados} usuaria(s) no encontradas en base de afiliados. Se muestran en la sección de errores.
          </div>
        )}

        {loading ? (
          <div className="skeleton h-40 w-full rounded-xl" />
        ) : (useInst ? instIpsNames.length === 0 : ipsGroups.length === 0) ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="empty-title">Sin datos</div>
            <div className="empty-desc">
              {correctedText ? 'Haz clic en "Validar Afiliación" para agrupar por IPS institucional.' : 'Sube un archivo y corrige errores para validar afiliación.'}
            </div>
          </div>
        ) : useInst ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {instIpsNames.map((ipsName) => (
              <button key={ipsName} onClick={() => handleSelectIps(ipsName)}
                className="panel text-left hover:shadow-md transition-shadow" style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ipsName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{instIpsGroups[ipsName].length} afiliadas</div>
                  </div>
                  <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ipsGroups.map((item) => (
              <button key={item.nombre} onClick={() => handleSelectIps(item.nombre)}
                className="panel text-left hover:shadow-md transition-shadow" style={{ cursor: 'pointer' }}>
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

        {instErrors.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--error)' }}>Usuarias no encontradas en base de afiliados ({instErrors.length})</div>
            <div className="table-wrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Tipo ID</th>
                    <th>Número ID</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {instErrors.map((err, i) => (
                    <tr key={i}>
                      <td className="text-xs">{err.row}</td>
                      <td className="text-xs">{err.original?.split(' ')[0]}</td>
                      <td className="text-xs">{err.original?.split(' ')[1]}</td>
                      <td className="text-xs" style={{ color: 'var(--error)' }}>{err.corrected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (view === 'ips_detail' && useInst && selectedIps) {
    const usuarias = instIpsGroups[selectedIps] || []
    const filtered = search ? usuarias.filter(u => {
      const q = search.toLowerCase()
      return u.numero_id?.toLowerCase().includes(q) || u.apellido1?.toLowerCase().includes(q) || u.nombre1?.toLowerCase().includes(q)
    }) : usuarias
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const pTotal = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="btn-ghost text-sm px-2 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="page-title">{selectedIps}</div>
            <div className="page-subtitle">{usuarias.length} afiliadas verificadas</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por documento, apellido o nombre..." className="input pl-9" />
          </div>
          <button onClick={handleSearch} className="btn-secondary text-sm">Buscar</button>
        </div>

        {loading ? (
          <div className="skeleton h-40 w-full rounded-xl" />
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-title">Sin registros</div>
            <div className="empty-desc">No se encontraron afiliadas para esta IPS.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">#</th>
                  {INST_COLS.map((col) => <th key={col.key}>{col.label}</th>)}
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u, i) => (
                  <tr key={`${u.numero_id}-${i}`}>
                    <td className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    {INST_COLS.map((col) => (
                      <td key={col.key} className="text-sm max-w-[120px] truncate">
                        {u[col.key] || '—'}
                      </td>
                    ))}
                    <td className="text-right">
                      <button className="btn-ghost text-xs px-2 py-1" title="Ver detalle">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pTotal > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Página {page} de {pTotal}</span>
                <div className="flex gap-1">
                  <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary px-2.5 py-1 text-xs">← Anterior</button>
                  <button onClick={() => handlePageChange(Math.min(pTotal, page + 1))} disabled={page >= pTotal} className="btn-secondary px-2.5 py-1 text-xs">Siguiente →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="btn-ghost text-sm px-2 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="page-title">{selectedIps || 'IPS'}</div>
            <div className="page-subtitle">{total} gestantes registradas</div>
          </div>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo registro
        </button>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por documento, apellido o nombre..." className="input pl-9" />
        </div>
        <button onClick={handleSearch} className="btn-secondary text-sm">Buscar</button>
      </div>

      {loading ? (
        <div className="skeleton h-40 w-full rounded-xl" />
      ) : registros.length === 0 ? (
        <div className="empty">
          <div className="empty-title">Sin registros</div>
          <div className="empty-desc">No se encontraron gestantes para esta IPS.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center">#</th>
                {TABLE_COLS.map((col) => <th key={col.key}>{col.label}</th>)}
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
