import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { updateGestante, createGestante, autoFillCasoCerrado, cleanAndRepopulate, validateAffiliation, fetchGestante, fetchGestanteByNumId, fetchGestanteColumns, fetchMisGestantes } from '../api'
import GestanteForm from './GestanteForm'
import ExcelJS from 'exceljs'

const PAGE_SIZE = 50

function fmtDate(v) {
  if (!v) return '—'
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) return s.split(' ')[0]
  return s
}

const INST_COLS = [
  { key: 'tipo_id', label: 'Tipo ID' },
  { key: 'numero_id', label: 'Número' },
  { key: 'apellido1', label: 'Apellido 1' },
  { key: 'apellido2', label: 'Apellido 2' },
  { key: 'nombre1', label: 'Nombre 1' },
  { key: 'nombre2', label: 'Nombre 2' },
]

const IPS_TABLE_COLS = [
  { key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', label: 'Tipo Doc' },
  { key: 'NO_DE_IDENTIFICACION', label: 'Documento' },
  { key: 'APELLIDO_1', label: 'Apellido 1' },
  { key: 'APELLIDO_2', label: 'Apellido 2' },
  { key: 'NOMBRE_1', label: 'Nombre 1' },
  { key: 'NOMBRE_2', label: 'Nombre 2' },
  { key: 'EDAD_ANOS', label: 'Edad' },
  { key: 'FUM', label: 'FUM' },
  { key: 'FPP', label: 'FPP' },
  { key: 'TRIMESTRE_INICIO_CONTROL', label: 'Trimestre' },
  { key: 'ESTADO_CIVIL', label: 'Estado Civil' },
  { key: 'NIVEL_EDUCATIVO', label: 'Nivel Educativo' },
  { key: 'DEPARTAMENTO_RESIDENCIA', label: 'Depto' },
  { key: 'MUNICIPIO_DE_RESIDENCIA', label: 'Municipio' },
  { key: 'TELEFONO_USUARIA', label: 'Telefono' },
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
  const isIpsUser = user?.role === 'ips_user'
  const ipsUserName = user?.ips_name || user?.name || ''

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

  const [ipsRows, setIpsRows] = useState([])
  const [ipsColumns, setIpsColumns] = useState([])
  const [ipsLoading, setIpsLoading] = useState(false)

  const loadIpsData = useCallback(async () => {
    if (!isIpsUser) return
    setIpsLoading(true); setError('')
    try {
      const data = await fetchMisGestantes()
      setIpsRows(data.rows || [])
      setIpsColumns(data.columns || [])
    } catch (e) {
      setError(e.message || 'Error cargando gestantes')
    } finally {
      setIpsLoading(false)
    }
  }, [isIpsUser])

  useEffect(() => {
    if (isIpsUser && ipsRows.length === 0 && !ipsLoading) {
      loadIpsData()
    }
  }, [isIpsUser, ipsRows.length, ipsLoading, loadIpsData])

  const downloadIpsExcel = async (ipsName) => {
    const usuarios = isIpsUser ? ipsRows : (filteredIpsGroups[ipsName] || [])
    if (!usuarios.length) return
    setDownloadingIps(ipsName)
    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'FENIX DATA'
      workbook.created = new Date()
      const sheet = workbook.addWorksheet(ipsName.substring(0, 31))
      if (isIpsUser && ipsColumns.length) {
        sheet.columns = ipsColumns.map(k => ({
          header: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          key: k,
          width: Math.min(Math.max(k.length + 2, 12), 40),
        }))
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 }
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } }
        sheet.getRow(1).eachCell(c => { c.alignment = { wrapText: true, vertical: 'middle' } })
        for (const row of usuarios) {
          const rowData = {}
          for (const k of ipsColumns) {
            let v = row[k] || ''
            if (v && typeof v === 'string') { v = v.trim(); if (v === 'None' || v === 'null') v = '' }
            rowData[k] = v
          }
          sheet.addRow(rowData)
        }
      } else {
        let allCols = []
        let labels = {}
        try {
          const colMeta = await fetchGestanteColumns()
          allCols = colMeta?.columns || []
          labels = colMeta?.labels || {}
        } catch {}
        const allRows = []
        for (const u of usuarios) {
          let fullData = null
          if (u.numero_id) {
            try { fullData = await fetchGestanteByNumId(u.numero_id) } catch { fullData = null }
          }
          if (!fullData) fullData = mapInstToGestanteKeys(u)
          allRows.push(fullData)
        }
        if (!allCols.length) {
          allCols = Object.keys(allRows[0] || {})
        }
        sheet.columns = allCols.map(k => ({
          header: labels[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          key: k,
          width: Math.min(Math.max((labels[k] || k).length + 2, 12), 40),
        }))
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 }
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } }
        for (const fullData of allRows) {
          const rowData = {}
          for (const k of allCols) {
            let v = fullData[k] || ''
            if (v && typeof v === 'string') { v = v.trim(); if (v === 'None' || v === 'null') v = '' }
            rowData[k] = v
          }
          sheet.addRow(rowData)
        }
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
    if (!isIpsUser && !instResult && !instValidating) {
      runAffiliationValidation()
    }
  }, [isIpsUser, instResult, instValidating, runAffiliationValidation])

  const ipsGroups = instResult?.ips_groups || {}
  const normalizeForMatch = (s) => (s || '').toUpperCase().replace(/[\.\-]/g, '').replace(/\s+/g, ' ').trim()

  const filteredIpsGroups = isIpsUser && ipsUserName
    ? Object.fromEntries(
        Object.entries(ipsGroups).filter(([name]) => {
          const normName = normalizeForMatch(name)
          const normIps = normalizeForMatch(ipsUserName)
          return normName.includes(normIps) || normIps.includes(normName)
        })
      )
    : ipsGroups
  const ipsNames = Object.keys(filteredIpsGroups)

  useEffect(() => {
    if (isIpsUser && ipsRows.length === 1 && view === 'list' && !selectedIps) {
      setView('ips_detail')
    }
  }, [isIpsUser, ipsRows, view, selectedIps])

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
    const numeroId = u.NO_DE_IDENTIFICACION || u.numero_id
    let fullData = null
    if (numeroId) {
      try {
        fullData = await fetchGestanteByNumId(numeroId)
        if (!fullData || Object.keys(fullData).length <= 2) fullData = null
      } catch (e) { fullData = null }
    }
    if (!fullData) fullData = u
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
      if (isIpsUser) loadIpsData()
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
      if (isIpsUser) loadIpsData()
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
      onClose={() => { setEditing(null); setView('ips_detail') }} ipsList={ipsNames} />
  }

  if (view === 'ips_detail' && showNewForm) {
    return <GestanteForm mode="create" onSave={handleCreate}
      onClose={() => { setShowNewForm(false); setView('ips_detail') }}
      initialData={{ NOMBRE_DE_LA_IPS_PRIMARIA: ipsUserName }} ipsList={ipsNames} />
  }

  if (view === 'list' && !isIpsUser) {
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
                <thead><tr><th>Fila</th><th>Tipo ID</th><th>Número ID</th><th>Detalle</th></tr></thead>
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

  if (view === 'ips_detail' && !isIpsUser && selectedIps) {
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

  if (isIpsUser && (view === 'list' || view === 'ips_detail')) {
    const filtered = search ? ipsRows.filter(r => {
      const q = search.toLowerCase()
      return (r.NO_DE_IDENTIFICACION || '').toLowerCase().includes(q) ||
             (r.APELLIDO_1 || '').toLowerCase().includes(q) ||
             (r.NOMBRE_1 || '').toLowerCase().includes(q) ||
             (r.APELLIDO_2 || '').toLowerCase().includes(q) ||
             (r.NOMBRE_2 || '').toLowerCase().includes(q)
    }) : ipsRows
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const pTotal = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

    const pageNumbers = []
    const maxVisible = 5
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2))
    let endPage = Math.min(pTotal, startPage + maxVisible - 1)
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1)
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)

    return (
      <div className="space-y-5 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Gestion de data</div>
            <div className="page-subtitle">
              {ipsLoading ? 'Cargando gestantes...' : `${filtered.length} gestantes registradas`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadIpsExcel(ipsUserName)} disabled={downloadingIps === ipsUserName}
              className="btn-secondary text-sm">
              {downloadingIps === ipsUserName ? (
                <svg className="w-4 h-4 animate-spin inline" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )} Descargar
            </button>
            <button onClick={() => { setShowNewForm(true); setView('ips_detail') }} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nueva
            </button>
          </div>
        </div>

        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

        {/* Barra de busqueda + info */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Buscar por documento, apellido o nombre..." className="input pl-9" />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }}>
              Limpiar
            </button>
          )}
        </div>

        {ipsLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sin resultados</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'No se encontraron gestantes con ese criterio.' : 'No hay gestantes registradas para tu IPS.'}
            </div>
          </div>
        ) : (
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--green-50)', borderBottom: '2px solid var(--green-200)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Documento</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Nombre</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Edad</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>FUM</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>FPP</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Municipio</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', color: 'var(--green-700)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '60px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r, i) => {
                    const rowNum = (page - 1) * PAGE_SIZE + i + 1
                    const isEven = i % 2 === 0
                    return (
                      <tr key={`${r.NO_DE_IDENTIFICACION}-${i}`}
                        style={{
                          backgroundColor: isEven ? 'var(--bg-canvas)' : 'var(--bg-surface)',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--green-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEven ? 'var(--bg-canvas)' : 'var(--bg-surface)'}>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '500' }}>
                          {rowNum}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          <span className="badge-neutral" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{r.NO_DE_IDENTIFICACION || '—'}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: '500' }}>{r.APELLIDO_1 || ''}</span>{' '}
                          {r.APELLIDO_2 ? r.APELLIDO_2 + ' ' : ''}/ {' '}
                          <span style={{ fontWeight: '500' }}>{r.NOMBRE_1 || ''}</span>{' '}
                          {r.NOMBRE_2 || ''}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {r.EDAD_ANOS ? `${r.EDAD_ANOS} años` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                          {fmtDate(r.FUM)}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                          {fmtDate(r.FPP)}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.MUNICIPIO_DE_RESIDENCIA || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button onClick={() => startEdit(r)}
                            title="Editar registro"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--green-200)',
                              backgroundColor: 'var(--green-50)', color: 'var(--green-600)', cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--green-500)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--green-500)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--green-50)'; e.currentTarget.style.color = 'var(--green-600)'; e.currentTarget.style.borderColor = 'var(--green-200)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginacion */}
            {pTotal > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Mostrando <strong style={{ color: 'var(--text-primary)' }}>{(page - 1) * PAGE_SIZE + 1}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{Math.min(page * PAGE_SIZE, filtered.length)}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page <= 1}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.72rem', fontWeight: '500', transition: 'all 0.15s' }}>
                    &laquo;
                  </button>
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.72rem', fontWeight: '500', transition: 'all 0.15s' }}>
                    &lsaquo;
                  </button>
                  {pageNumbers.map(pn => (
                    <button key={pn} onClick={() => setPage(pn)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: pn === page ? '600' : '500', cursor: 'pointer', transition: 'all 0.15s',
                        border: pn === page ? '1px solid var(--green-500)' : '1px solid var(--border-subtle)',
                        backgroundColor: pn === page ? 'var(--green-500)' : 'var(--bg-canvas)',
                        color: pn === page ? '#fff' : 'var(--text-primary)',
                      }}>
                      {pn}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(pTotal, page + 1))} disabled={page >= pTotal}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)', color: page >= pTotal ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page >= pTotal ? 'not-allowed' : 'pointer', fontSize: '0.72rem', fontWeight: '500', transition: 'all 0.15s' }}>
                    &rsaquo;
                  </button>
                  <button onClick={() => setPage(pTotal)} disabled={page >= pTotal}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)', color: page >= pTotal ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page >= pTotal ? 'not-allowed' : 'pointer', fontSize: '0.72rem', fontWeight: '500', transition: 'all 0.15s' }}>
                    &raquo;
                  </button>
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
