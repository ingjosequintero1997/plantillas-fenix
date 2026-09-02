import React, { useEffect, useState, useMemo } from 'react'
import { fetchIpsGrupos, fetchGestantes, fetchIps, updateGestante, createGestante, autoFillCasoCerrado, fetchCasoCerrado, populateGestantes, cleanAndRepopulate } from '../api'
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
    setLoading(true)
    setError('')
    try {
      const data = await fetchIpsGrupos()
      if (!data) {
        setError('Respuesta vacía del servidor')
        setIpsGroups([])
        return
      }
      if (data.error) {
        setError(data.error)
        setIpsGroups([])
        return
      }
      setIpsGroups(data.ips || [])
    } catch (e) {
      const errMsg = e.message || 'No se pudieron cargar las IPS'
      console.error('Error loading IPS groups:', errMsg)
      setError(`Error: ${errMsg}. Si el problema persiste, contacta administración.`)
      setIpsGroups([])
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
    setMsg('')
    setView('editing')
  }

  const handleSaveEdit = async (data) => {
    await updateGestante(editing.id, data)
    setEditing(null)
    setView('ips_detail')
    loadGestantes(selectedIps?.nombre || '', page, search)
  }

  const handleCreate = async (data) => {
    await createGestante(data)
    setShowNewForm(false)
    setView('ips_detail')
    loadGestantes(selectedIps?.nombre || '', page, search)
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
    setPopulating(true); setPopulateMsg('Limpiando y re-poblando con diagnóstico...')
    try {
      const data = await cleanAndRepopulate()
      if (data.error) {
        setPopulateMsg('Error: ' + data.error)
      } else {
        const diag = data.diagnostico || {}
        setPopulateMsg(
          `Listo: ${data.insertadas} gestantes insertadas. ` +
          `IPS en CSV columna #${diag.ips_col_index_csv ?? '?'} ` +
          `(mapeado: ${diag.ips_mapped_correctly ? 'OK' : 'FALLÓ'}). ` +
          `Valor muestra IPS: "${diag.sample_ips_value ?? '?'}". ` +
          `Headers mapeados: ${diag.total_mapped}/${diag.total_headers_csv}`
        )
        loadIpsGroups()
      }
    } catch (e) {
      setPopulateMsg('Error: ' + (e.message || 'No se pudo re-poblar'))
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
    return <GestanteForm mode="edit" initialData={editing} onSave={handleSaveEdit}
      onClose={() => { setEditing(null); setView('ips_detail') }} />
  }

  // ─── New gestante form ────────────────────────────────────
  if (view === 'ips_detail' && showNewForm) {
    return <GestanteForm mode="create" onSave={handleCreate}
      onClose={() => setShowNewForm(false)}
      initialData={{ NOMBRE_DE_LA_IPS_PRIMARIA: selectedIps?.nombre || '' }} />
  }

  // ─── IPS List view ────────────────────────────────────────
  if (view === 'ips_list') {
    const IPS_INVALIDOS = new Set(['NO', 'SI', 'N/A', 'NA', 'SIN IPS', 'S/N', '-', '0', 'NO APLICA'])
    const ipsValidas = ipsGroups.filter(ig => !IPS_INVALIDOS.has(ig.nombre.toUpperCase().trim()))
    const ipsInvalidas = ipsGroups.filter(ig => IPS_INVALIDOS.has(ig.nombre.toUpperCase().trim()))
    const totalGestantes = ipsValidas.reduce((sum, ig) => sum + ig.total, 0)
    const totalInvalidas = ipsInvalidas.reduce((sum, ig) => sum + ig.total, 0)

    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Gestión de data</div>
            <div className="page-subtitle">{ipsValidas.length} IPS · {totalGestantes.toLocaleString()} gestantes</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePopulate} disabled={populating} className="btn-secondary text-sm" style={{ borderColor: '#e74c3c', color: '#e74c3c' }}>
              {populating ? 'Re-poblando...' : 'Re-poblar data'}
            </button>
            <button onClick={handleAutoFillCasoCerrado} className="btn-secondary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Auto-fill Caso Cerrado
            </button>
          </div>
        </div>

        {autoFillMsg && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: autoFillMsg.includes('Error') ? 'var(--error)' : 'var(--primary)', backgroundColor: autoFillMsg.includes('Error') ? '#FBE9E9' : '#EEF3F7' }}>{autoFillMsg}</div>
        )}

        {populateMsg && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: populateMsg.includes('Error') ? 'var(--error)' : 'var(--text-secondary)', backgroundColor: populateMsg.includes('Error') ? '#FBE9E9' : '#F0F0F0', whiteSpace: 'pre-wrap' }}>{populateMsg}</div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
        )}

        {ipsInvalidas.length > 0 && (
          <div className="px-3 py-2 rounded-md text-xs" style={{ color: '#e67e22', backgroundColor: '#FEF3E2' }}>
            {ipsInvalidas.length} grupo(s) con datos de IPS inválidos ({ipsInvalidas.map(iv => `"${iv.nombre}" (${iv.total})`).join(', ')}). Se ocultan de la vista. Usa "Re-poblar data" para corregir.
          </div>
        )}

        {loading ? (
          <div className="skeleton h-40 w-full rounded-xl" />
        ) : ipsValidas.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="empty-title">Sin datos</div>
            <div className="empty-desc">No hay registros de gestantes válidos. Haz clic en "Re-poblar data" para importar desde los cargues.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ipsValidas.map((item) => (
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


// EditForm and NewGestanteForm replaced by GestanteForm component
