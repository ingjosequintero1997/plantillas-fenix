import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { updateGestante, createGestante, autoFillCasoCerrado, cleanAndRepopulate, validateAffiliation, fetchGestante, fetchGestanteByNumId } from '../api'
import GestanteForm from './GestanteForm'
import ExcelJS from 'exceljs'

const PAGE_SIZE = 50

const INST_COLS = [
  { key: 'tipo_id', label: 'Tipo ID' },
  { key: 'numero_id', label: 'Número' },
  { key: 'apellido1', label: 'Apellido 1' },
  { key: 'apellido2', label: 'Apellido 2' },
  { key: 'nombre1', label: 'Nombre 1' },
  { key: 'nombre2', label: 'Nombre 2' },
]

const GESTANTE_TABLE_COLS = [
  { key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', label: 'Tipo Doc' },
  { key: 'NO_DE_IDENTIFICACION', label: 'Documento' },
  { key: 'APELLIDO_1', label: 'Apellido 1' },
  { key: 'APELLIDO_2', label: 'Apellido 2' },
  { key: 'NOMBRE_1', label: 'Nombre 1' },
  { key: 'NOMBRE_2', label: 'Nombre 2' },
  { key: 'FUM', label: 'FUM' },
  { key: 'CASO_CERRADO', label: 'Caso Cerrado' },
]

function mapInstToGestanteKeys(u) {
  return {
    TIPO_DE_DOCUMENTO_DE_IDENTIDAD: u.tipo_id || '',
    NO_DE_IDENTIFICACION: u.numero_id || '',
    APELLIDO_1: u.apellido1 || '',
    APELLIDO_2: u.apellido2 || '',
    NOMBRE_1: u.nombre1 || '',
    NOMBRE_2: u.nombre2 || '',
  }
}

export default function DataManagement({ correctedText }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [view, setView] = useState('list')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedIps, setSelectedIps] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [autoFillMsg, setAutoFillMsg] = useState('')
  const [populating, setPopulating] = useState(false)
  const [populateMsg, setPopulateMsg] = useState('')
  const [instResult, setInstResult] = useState(null)
  const [instValidating, setInstValidating] = useState(false)
  const [downloadingIps, setDownloadingIps] = useState(null)

  const downloadIpsExcel = async (ipsName) => {
    const usuarios = filteredIpsGroups[ipsName] || []
    if (!usuarios.length) return
    setDownloadingIps(ipsName)
    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'FENIX DATA'
      workbook.created = new Date()
      const sheet = workbook.addWorksheet(ipsName.substring(0, 31))
      const cols = [
        { header: 'Tipo Doc', key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', width: 10 },
        { header: 'No. Identificacion', key: 'NO_DE_IDENTIFICACION', width: 18 },
        { header: 'Apellido 1', key: 'APELLIDO_1', width: 15 },
        { header: 'Apellido 2', key: 'APELLIDO_2', width: 15 },
        { header: 'Nombre 1', key: 'NOMBRE_1', width: 15 },
        { header: 'Nombre 2', key: 'NOMBRE_2', width: 15 },
        { header: 'Fecha Nacimiento', key: 'FECHA_DE_NACIMIENTO', width: 15 },
        { header: 'Edad', key: 'EDAD', width: 8 },
        { header: 'Sexo', key: 'SEXO', width: 10 },
        { header: 'Regimen', key: 'REGIMEN_DE_AFILIACION', width: 12 },
        { header: 'Depto Residencia', key: 'DEPARTAMENTO_DE_RESIDENCIA', width: 18 },
        { header: 'Municipio', key: 'MUNICIPIO_DE_RESIDENCIA', width: 18 },
        { header: 'Zona', key: 'ZONA', width: 10 },
        { header: 'Telefono', key: 'TELEFONO_USUARIA', width: 15 },
        { header: 'Direccion', key: 'DIRECCION', width: 25 },
        { header: 'FUM', key: 'FUM', width: 15 },
        { header: 'IPS Primaria', key: 'NOMBRE_DE_LA_IPS_PRIMARIA', width: 30 },
        { header: 'Clasif Riesgo', key: 'CLASIFICACION_DEL_RIESGO', width: 20 },
        { header: 'Caso Cerrado', key: 'CASO_CERRADO', width: 12 },
        { header: 'Observaciones', key: 'OBSERVACIONES_GENERALES', width: 30 },
      ]
      sheet.columns = cols
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } }
      for (const u of usuarios) {
        let fullData = null
        if (u.numero_id) {
          try { fullData = await fetchGestanteByNumId(u.numero_id) } catch { fullData = null }
        }
        if (!fullData) fullData = mapInstToGestanteKeys(u)
        const row = {}
        for (const c of cols) { row[c.key] = fullData[c.key] || '' }
        sheet.addRow(row)
      }
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data_${ipsName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Error descargando: ' + (e.message || e)) }
    finally { setDownloadingIps(null) }
  }

  const runAffiliationValidation = useCallback(async () => {
    if (instValidating || instResult) return
    setInstValidating(true); setError('')
    try {
      const data = await validateAffiliation('')
      setInstResult(data)
    } catch (e) {
      setError(e.message || 'Error validando afiliación')
      setInstResult({ error: true })
    } finally {
      setInstValidating(false)
    }
  }, [instValidating, instResult])

  useEffect(() => {
    if (!instResult && !instValidating) {
      runAffiliationValidation()
    }
  }, [instResult, instValidating, runAffiliationValidation])

  const ipsGroups = instResult?.ips_groups || {}
  const isIpsUser = user?.role === 'ips_user'
  const ipsUserCode = user?.ips_code || ''
  const ipsUserName = user?.ips_name || user?.name || ''

  const filteredIpsGroups = isIpsUser && ipsUserCode
    ? Object.fromEntries(
        Object.entries(ipsGroups).filter(([, usuarios]) =>
          usuarios.some(u => String(u.ips_code || '').trim() === String(ipsUserCode).trim())
        )
      )
    : isIpsUser && ipsUserName
      ? Object.fromEntries(
          Object.entries(ipsGroups).filter(([name]) =>
            name.toUpperCase().includes(ipsUserName.toUpperCase()) ||
            ipsUserName.toUpperCase().includes(name.toUpperCase())
          )
        )
      : ipsGroups
  const ipsNames = Object.keys(filteredIpsGroups)

  useEffect(() => {
    if (isIpsUser && ipsNames.length === 1 && view === 'list' && !selectedIps) {
      setSelectedIps(ipsNames[0])
      setView('ips_detail')
    }
  }, [isIpsUser, ipsNames, view, selectedIps])

  const noEncontrados = instResult?.no_encontrados || 0
  const instErrors = instResult?.errors || []
  const encontrados = instResult?.encontrados || 0

  const handleSelectIps = (ipsName) => {
    setSelectedIps(ipsName)
    setPage(1); setSearch('')
    setView('ips_detail')
  }

  const handleBack = () => {
    setView('list'); setSelectedIps(null); setPage(1); setSearch('')
  }

  const startEdit = async (u) => {
    const numeroId = u.numero_id
    let fullData = null
    if (numeroId) {
      try {
        fullData = await fetchGestanteByNumId(numeroId)
        if (!fullData || Object.keys(fullData).length <= 2) fullData = null
      } catch (e) { fullData = null }
    }
    if (!fullData) {
      const gid = u.gestante_id || u.id
      if (gid) {
        try {
          fullData = await fetchGestante(gid)
          if (!fullData || Object.keys(fullData).length <= 2) fullData = null
        } catch (e) { fullData = null }
      }
    }
    if (!fullData) fullData = mapInstToGestanteKeys(u)
    const editId = fullData.id || null
    if (editId) delete fullData.id
    setEditing({ ...fullData, id: editId, _from_gestantes: !!editId, _key: Date.now() })
    setView('editing')
  }

  const handleSaveEdit = async (data) => {
    setLoading(true); setError('')
    try {
      if (editing._from_gestantes && editing.id) {
        await updateGestante(editing.id, data)
      } else {
        await createGestante(data)
      }
      setEditing(null); setView('ips_detail')
    } catch (e) {
      setError('Error al guardar: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data) => {
    setLoading(true); setError('')
    try {
      await createGestante(data)
      setShowNewForm(false); setView('ips_detail')
    } catch (e) {
      setError('Error al crear: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleAutoFillCasoCerrado = async () => {
    try {
      const data = await autoFillCasoCerrado()
      setAutoFillMsg(`Caso Cerrado auto-llenado: ${data.total_caso_cerrado} registros`)
      setTimeout(() => setAutoFillMsg(''), 5000)
    } catch (e) { setAutoFillMsg('Error: ' + (e.message || '')) }
  }

  const handlePopulate = async () => {
    setPopulating(true); setPopulateMsg('Limpiando y re-poblando...')
    try {
      const data = await cleanAndRepopulate()
      if (data.error) { setPopulateMsg('Error: ' + data.error) }
      else {
        const d = data.diagnostico || {}
        setPopulateMsg(`${data.insertadas} gestantes insertadas. Headers: ${d.total_mapped}/${d.total_headers_csv}`)
      }
    } catch (e) { setPopulateMsg('Error: ' + (e.message || '')) }
    finally { setPopulating(false) }
  }

  if (view === 'editing' && editing) {
    return <GestanteForm mode="edit" initialData={editing} onSave={handleSaveEdit}
      onClose={() => { setEditing(null); setView('ips_detail') }} />
  }

  if (view === 'ips_detail' && showNewForm) {
    return <GestanteForm mode="create" onSave={handleCreate}
      onClose={() => { setShowNewForm(false); setView('ips_detail') }}
      initialData={{ NOMBRE_DE_LA_IPS_PRIMARIA: selectedIps || '' }} />
  }

  if (view === 'list') {
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Gestión de data</div>
            <div className="page-subtitle">
              {instValidating ? 'Validando afiliación con BD corporativa...' :
               ipsNames.length > 0 ? `${ipsNames.length} IPS · ${encontrados} afiliadas verificadas` :
               correctedText ? 'Cargando...' : 'Carga y valida datos primero'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
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

        {noEncontrados > 0 && (
          <div className="px-3 py-2 rounded-md text-xs" style={{ color: '#e67e22', backgroundColor: '#FEF3E2' }}>
            {noEncontrados} usuaria(s) no encontradas en base de afiliados.
          </div>
        )}

        {instValidating ? (
          <div className="space-y-3">
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ) : ipsNames.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="empty-title">Sin datos</div>
            <div className="empty-desc">Sube un Excel y corrige errores en el validador para ver las IPS aquí.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ipsNames.map((ipsName) => (
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
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{filteredIpsGroups[ipsName].length} afiliadas</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); downloadIpsExcel(ipsName) }}
                    disabled={downloadingIps === ipsName}
                    className="btn-ghost text-xs px-2 py-1" title="Descargar Excel">
                    {downloadingIps === ipsName ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </button>
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
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--error)' }}>Usuarias no encontradas ({instErrors.length})</div>
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

  if (view === 'ips_detail' && selectedIps) {
    const usuarias = filteredIpsGroups[selectedIps] || []
    const filtered = search ? usuarias.filter(u => {
      const q = search.toLowerCase()
      return u.numero_id?.toLowerCase().includes(q) || u.apellido1?.toLowerCase().includes(q) || u.nombre1?.toLowerCase().includes(q)
    }) : usuarias
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const pTotal = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="btn-ghost text-sm px-2 py-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <div className="page-title">{selectedIps}</div>
              <div className="page-subtitle">{usuarias.length} afiliadas verificadas</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadIpsExcel(selectedIps)} disabled={downloadingIps === selectedIps}
              className="btn-secondary text-sm">
              {downloadingIps === selectedIps ? (
                <svg className="w-4 h-4 animate-spin inline" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )} Descargar Excel
            </button>
            <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nueva usuaria
            </button>
          </div>
        </div>

        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Buscar por documento, apellido o nombre..." className="input pl-9" />
          </div>
        </div>

        {filtered.length === 0 ? (
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
                  <th className="text-right">Acciones</th>
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
                      <button onClick={() => startEdit(u)} className="btn-ghost text-xs px-2 py-1" title="Actualizar">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary px-2.5 py-1 text-xs">← Anterior</button>
                  <button onClick={() => setPage(Math.min(pTotal, page + 1))} disabled={page >= pTotal} className="btn-secondary px-2.5 py-1 text-xs">Siguiente →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return <div className="skeleton h-40 w-full rounded-xl" />
}
