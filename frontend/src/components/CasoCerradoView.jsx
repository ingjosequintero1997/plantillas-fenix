import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { fetchIpsGruposCasoCerrado, fetchCasoCerrado, exportarCasoCerrado, fetchGestante, updateGestante } from '../api'
import GestanteForm from './GestanteForm'
import Pagination from './Pagination'

const PAGE_SIZE = 50

// Columnas legibles de la tabla de casos cerrados.
const TABLE_COLS = [
  { key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', label: 'Tipo doc' },
  { key: 'NO_DE_IDENTIFICACION', label: 'Nro. identificación' },
  { key: 'APELLIDO_1', label: 'Apellido 1' },
  { key: 'NOMBRE_1', label: 'Nombres' },
  { key: 'FUM', label: 'FUM', fmt: true },
  { key: 'FECHA_DE_PARTO', label: 'Fecha de parto', fmt: true },
  { key: 'FECHA_DE_ABORTO', label: 'Fecha de aborto', fmt: true },
]

function fmtDate(v) {
  if (!v) return '—'
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) return s.split(' ')[0]
  return s
}

function safeFilename(name) {
  return (name || 'ips').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'ips'
}

export default function CasoCerradoView() {
  const { user } = useAuth()
  const isIpsUser = user?.role === 'ips_user'

  const [view, setView] = useState('list')
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [ipsSearch, setIpsSearch] = useState('')
  const [selectedIps, setSelectedIps] = useState(null)

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loadingRows, setLoadingRows] = useState(false)

  const [editing, setEditing] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [error, setError] = useState('')

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true); setError('')
    try {
      const data = await fetchIpsGruposCasoCerrado()
      setGroups(Array.isArray(data?.ips) ? data.ips : [])
    } catch (e) {
      setError(e.message || 'Error cargando las IPS con casos cerrados')
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  const loadRecords = useCallback(async (ipsName, currentPage, currentSearch) => {
    setLoadingRows(true); setError('')
    try {
      const data = await fetchCasoCerrado(currentPage, PAGE_SIZE, currentSearch, ipsName)
      setRows(Array.isArray(data?.registros) ? data.registros : [])
      setTotal(Number(data?.total) || 0)
    } catch (e) {
      setError(e.message || 'Error cargando los casos cerrados')
      setRows([]); setTotal(0)
    } finally {
      setLoadingRows(false)
    }
  }, [])

  useEffect(() => {
    if (view !== 'detail' || !selectedIps) return
    // Pequeño retardo para no consultar en cada tecla de la búsqueda.
    const timer = setTimeout(() => {
      loadRecords(selectedIps, page, search)
    }, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [view, selectedIps, page, search, loadRecords])

  // Un usuario IPS solo ve su propia IPS: abrir el detalle directamente.
  useEffect(() => {
    if (isIpsUser && view === 'list' && !selectedIps && groups.length === 1) {
      setSelectedIps(groups[0].nombre)
      setPage(1); setSearch('')
      setView('detail')
    }
  }, [isIpsUser, view, selectedIps, groups])

  const handleSelectIps = (ipsName) => {
    setSelectedIps(ipsName)
    setPage(1); setSearch('')
    setView('detail')
  }

  const handleBack = () => {
    setView('list'); setSelectedIps(null); setPage(1); setSearch('')
  }

  const handleDownload = async (ipsName) => {
    setError(''); setDownloading(ipsName)
    try {
      await exportarCasoCerrado(`caso_cerrado_${safeFilename(ipsName)}.xlsx`, ipsName)
    } catch (e) {
      setError(e.message || 'No se pudo descargar el Excel')
    } finally {
      setDownloading(null)
    }
  }

  const startEdit = async (row) => {
    setError('')
    let full = null
    if (row.id != null) {
      try {
        full = await fetchGestante(row.id)
      } catch (e) {
        full = null
      }
    }
    if (!full || Object.keys(full).length === 0) full = { ...row }
    const id = full.id != null ? full.id : row.id
    if (id != null) delete full.id
    setEditing({ ...full, id, _key: Date.now() })
  }

  const handleSaveEdit = async (data) => {
    if (!editing?.id) throw new Error('No se pudo identificar el registro a actualizar')
    await updateGestante(editing.id, data)
    setEditing(null)
    loadRecords(selectedIps, page, search)
  }

  if (editing) {
    return (
      <GestanteForm
        mode="edit"
        initialData={editing}
        onSave={handleSaveEdit}
        onClose={() => setEditing(null)}
        ipsList={groups.map((g) => g.nombre)}
      />
    )
  }

  const displayedGroups = ipsSearch
    ? groups.filter((g) => (g.nombre || '').toUpperCase().includes(ipsSearch.toUpperCase()))
    : groups
  const totalCerrados = groups.reduce((acc, g) => acc + (Number(g.total) || 0), 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (view === 'detail' && selectedIps) {
    return (
      <div className="space-y-5 fade-in">
        <div className="panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={handleBack} className="btn-ghost px-2 py-1" title="Volver">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--primary-light)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="page-title" style={{ fontSize: '1.1rem' }}>{selectedIps}</div>
                <div className="page-subtitle">
                  {loadingRows ? 'Cargando casos cerrados...' : `${total} caso${total !== 1 ? 's' : ''} cerrado${total !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            <button onClick={() => handleDownload(selectedIps)} disabled={downloading === selectedIps} className="btn-secondary text-sm">
              {downloading === selectedIps ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )}
              Descargar Excel
            </button>
          </div>
        </div>

        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>}

        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por documento, apellido o nombre..."
            className="input pl-9"
          />
        </div>

        {loadingRows ? (
          <div className="space-y-3">
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="empty-title">Sin registros</div>
            <div className="empty-desc">
              {search ? 'No se encontraron casos cerrados con ese criterio.' : 'Esta IPS no tiene casos cerrados.'}
            </div>
          </div>
        ) : (
          <div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {TABLE_COLS.map((col) => <th key={col.key}>{col.label}</th>)}
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id != null ? row.id : `${row.NO_DE_IDENTIFICACION}-${i}`}>
                      {TABLE_COLS.map((col) => (
                        <td key={col.key} style={{ whiteSpace: 'nowrap' }}>
                          {col.fmt ? fmtDate(row[col.key]) : (row[col.key] || '—')}
                        </td>
                      ))}
                      <td className="text-center">
                        <button onClick={() => startEdit(row)} className="btn-ghost text-xs px-2 py-1" title="Editar registro">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      </td>
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

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="page-title">Caso cerrado</div>
            <div className="page-subtitle">
              {loadingGroups ? 'Cargando IPS...' : `${groups.length} IPS · ${totalCerrados} caso${totalCerrados !== 1 ? 's' : ''} cerrado${totalCerrados !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>}

      {groups.length > 0 && (
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={ipsSearch}
            onChange={(e) => setIpsSearch(e.target.value)}
            placeholder="Buscar IPS por nombre..."
            className="input pl-9"
          />
        </div>
      )}

      {loadingGroups ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full rounded-xl" />
          <div className="skeleton h-16 w-full rounded-xl" />
          <div className="skeleton h-16 w-full rounded-xl" />
        </div>
      ) : groups.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="empty-title">Sin resultados</div>
          <div className="empty-desc">
            {ipsSearch ? `No se encontraron IPS con "${ipsSearch}"` : 'No hay casos cerrados registrados.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedGroups.map((group) => (
            <div key={group.nombre} className="panel" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectIps(group.nombre)}
                  className="flex-1 min-w-0 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--primary-light)' }}>
                      <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{group.nombre}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {group.total} caso{group.total !== 1 ? 's' : ''} cerrado{group.total !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDownload(group.nombre)}
                  disabled={downloading === group.nombre}
                  className="btn-ghost text-xs px-2 py-1 shrink-0"
                  title="Descargar Excel"
                >
                  {downloading === group.nombre ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </button>
                <button onClick={() => handleSelectIps(group.nombre)} className="btn-ghost text-xs px-1 py-1 shrink-0" title="Abrir">
                  <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
