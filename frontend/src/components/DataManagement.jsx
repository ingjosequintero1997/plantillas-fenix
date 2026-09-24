import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { updateGestante, createGestante, autoFillCasoCerrado, exportarCasoCerrado, exportarIpsExcel, fetchCasoCerrado, cleanAndRepopulate, validateAffiliation, fetchGestante, fetchGestanteByNumId, fetchGestanteColumns, fetchMisGestantes } from '../api'
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
  { key: 'fum', label: 'FUM', fmt: fmtDate },
  { key: 'fpp', label: 'FPP', fmt: fmtDate },
  { key: 'municipio', label: 'Municipio' },
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
  const [ipsSearch, setIpsSearch] = useState('')
  const [municipioFilter, setMunicipioFilter] = useState('')
  const [mesFiltro, setMesFiltro] = useState('')
  const [casosCerradosTotal, setCasosCerradosTotal] = useState(0)

  const [ipsRows, setIpsRows] = useState([])
  const [ipsColumns, setIpsColumns] = useState([])
  const [ipsLoading, setIpsLoading] = useState(false)

  const [ipsLoadAttempted, setIpsLoadAttempted] = useState(false)

  const loadIpsData = useCallback(async (mesParam) => {
    if (!isIpsUser) return
    const mes = mesParam !== undefined ? mesParam : mesFiltro
    setIpsLoading(true); setError('')
    try {
      const data = await fetchMisGestantes(mes)
      setIpsRows(data.rows || [])
      setIpsColumns(data.columns || [])
      setIpsLoadAttempted(true)
    } catch (e) {
      setError(e.message || 'Error cargando gestantes')
      setIpsLoadAttempted(true)
    } finally {
      setIpsLoading(false)
    }
  }, [isIpsUser, mesFiltro])

  useEffect(() => {
    if (isIpsUser && !ipsLoadAttempted && !ipsLoading) {
      loadIpsData()
    }
  }, [isIpsUser, ipsLoadAttempted, ipsLoading, loadIpsData])

  useEffect(() => {
    if (!isIpsUser) {
      setIpsLoadAttempted(false)
      setIpsRows([])
    }
  }, [isIpsUser])

  const downloadIpsExcel = async (ipsName, filteredData) => {
    if (!isIpsUser) {
      setDownloadingIps(ipsName)
      try {
        const safe = ipsName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'ips'
        await exportarIpsExcel(ipsName, mesFiltro, `${safe}.xlsx`)
      } catch (e) { alert('Error descargando: ' + (e.message || e)) }
      finally { setDownloadingIps(null) }
      return
    }
    const usuarios = filteredData || ipsRows
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
        const allCols = ['tipo_id', 'numero_id', 'apellido1', 'apellido2', 'nombre1', 'nombre2', 'municipio']
        const labels = { tipo_id: 'Tipo Doc', numero_id: 'Documento', apellido1: 'Apellido 1', apellido2: 'Apellido 2', nombre1: 'Nombre 1', nombre2: 'Nombre 2', municipio: 'Municipio' }
        sheet.columns = allCols.map(k => ({
          header: labels[k] || k,
          key: k,
          width: Math.min(Math.max((labels[k] || k).length + 2, 12), 40),
        }))
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 }
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } }
        for (const u of usuarios) {
          const rowData = {}
          for (const k of allCols) {
            let v = u[k] || ''
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

  const runAffiliationValidation = useCallback(async (mesParam, force = false) => {
    if (instValidating) return
    if (instResult && !force) return
    const mes = mesParam !== undefined ? mesParam : mesFiltro
    setInstValidating(true); setError('')
    try {
      const data = await validateAffiliation('', 'gestante', mes)
      setInstResult(data)
    } catch (e) {
      setError(e.message || 'Error validando afiliación')
      setInstResult({ error: true })
    } finally {
      setInstValidating(false)
    }
  }, [instValidating, instResult, mesFiltro])

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
  const displayedIpsNames = ipsSearch
    ? ipsNames.filter(n => n.toUpperCase().includes(ipsSearch.toUpperCase()))
    : ipsNames

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
      } catch (e) {
        console.warn('Error cargando gestante por numid:', e)
        fullData = null
      }
    }
    if (!fullData) fullData = { ...u }
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

  const loadCasosCerrados = useCallback(async () => {
    try {
      const d = await fetchCasoCerrado()
      setCasosCerradosTotal(d?.total || 0)
    } catch (e) { /* ignore */ }
  }, [])

  const handleGenerarCasosCerrados = async () => {
    setAutoFillMsg('Procesando casos cerrados...')
    try {
      const data = await autoFillCasoCerrado()
      await loadCasosCerrados()
      await runAffiliationValidation(undefined, true)
      setAutoFillMsg(`Casos cerrados procesados: ${data.total_caso_cerrado} registros movidos a su propia data.`)
      setTimeout(() => setAutoFillMsg(''), 6000)
    } catch (e) { setAutoFillMsg('Error: ' + (e.message || '')) }
  }

  const handleDescargarCasosCerrados = async () => {
    setAutoFillMsg('Generando Excel de casos cerrados...')
    try {
      await exportarCasoCerrado('casos_cerrados.xlsx')
      setAutoFillMsg('Excel de casos cerrados descargado.')
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <div className="page-title">Gestión de data</div>
              <div className="page-subtitle">
                {instValidating ? 'Validando afiliación con BD corporativa...' :
                 ipsNames.length > 0 ? `${displayedIpsNames.length}${ipsSearch ? ` de ${ipsNames.length}` : ''} IPS · ${encontrados} afiliadas verificadas` :
                 correctedText ? 'Cargando...' : 'Carga y valida datos primero'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={handleGenerarCasosCerrados} className="btn-secondary text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Generar casos cerrados
              </button>
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
        {casosCerradosTotal > 0 && (
          <div className="panel flex items-center justify-between gap-3 flex-wrap" style={{ borderLeft: '4px solid #B42318' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Casos cerrados</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{casosCerradosTotal} registro{casosCerradosTotal !== 1 ? 's' : ''} aparte, fuera de la data principal</div>
              </div>
            </div>
            <button onClick={handleDescargarCasosCerrados} className="btn-secondary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar Excel
            </button>
          </div>
        )}
        {ipsNames.length > 0 && (
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={ipsSearch} onChange={(e) => setIpsSearch(e.target.value)}
              placeholder="Buscar IPS por nombre..." className="input pl-9" style={{ fontSize: '0.85rem' }} />
            {ipsSearch && (
              <button onClick={() => setIpsSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost text-xs px-1" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="empty-title">Sin resultados</div>
            <div className="empty-desc">
              {ipsSearch ? `No se encontraron IPS con "${ipsSearch}"` : 'Sube un Excel y corrige errores en el validador para ver las IPS aquí.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedIpsNames.map((ipsName) => (
              <button key={ipsName} onClick={() => handleSelectIps(ipsName)}
                className="panel text-left hover:shadow-md transition-all" style={{ cursor: 'pointer', borderLeft: '3px solid var(--primary)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--primary-light)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ipsName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {filteredIpsGroups[ipsName].length} afiliada{filteredIpsGroups[ipsName].length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); downloadIpsExcel(ipsName) }}
                    disabled={downloadingIps === ipsName}
                    className="btn-ghost text-xs px-2 py-1 shrink-0" title="Descargar Excel">
                    {downloadingIps === ipsName ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </button>
                  <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead style={{ backgroundColor: 'var(--green-50)', borderBottom: '2px solid var(--green-200)' }}>
                  <tr style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--green-700)', fontWeight: '600' }}>#</th>
                    {INST_COLS.map((col) => <th key={col.key} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--green-700)', fontWeight: '600', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{col.label}</th>)}
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--green-700)', fontWeight: '600', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {instErrors.map((err, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'var(--bg-canvas)' : 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '500' }}>
                        {i + 1}
                      </td>
                      {INST_COLS.map((col) => {
                        const val = col.fmt ? col.fmt(err[col.key] || '') : (err[col.key] || '—')
                        return <td key={col.key} style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: col.fmt ? '0.75rem' : '0.72rem', whiteSpace: 'nowrap' }}>
                          {val}
                        </td>
                      })}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button onClick={() => startEdit(err)} className="btn-ghost text-xs px-2 py-1" title="Actualizar">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      </td>
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
    const allKeys = usuarias.length > 0 ? Object.keys(usuarias[0]) : []
    const adminMunicipioKey = allKeys.find(k => k.toLowerCase() === 'municipio')
      || allKeys.find(k => k.toLowerCase().includes('municipio'))
      || 'municipio'
    const adminMunicipios = [...new Set(usuarias.map(u => u[adminMunicipioKey]).filter(Boolean))].sort()
    const filtered = usuarias.filter(u => {
      if (mesFiltro && u.mes !== mesFiltro) return false
      if (municipioFilter && u[adminMunicipioKey] !== municipioFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return u.numero_id?.toLowerCase().includes(q) || u.apellido1?.toLowerCase().includes(q) || u.nombre1?.toLowerCase().includes(q)
    })
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const pTotal = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

    return (
      <div className="space-y-5 fade-in">
        <div className="panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="btn-ghost px-2 py-1">
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
                  {municipioFilter ? `${filtered.length} afiliada${filtered.length !== 1 ? 's' : ''} en ${municipioFilter}` : `${usuarias.length} afiliadas verificadas`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadIpsExcel(selectedIps, filtered)} disabled={downloadingIps === selectedIps}
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
        </div>
        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Buscar por documento, apellido o nombre..." className="input pl-9" />
          </div>
          {adminMunicipios.length > 0 && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select value={municipioFilter} onChange={(e) => { setMunicipioFilter(e.target.value); setPage(1) }}
                className="select" style={{ fontSize: '0.8rem', minWidth: '180px' }}>
                <option value="">Todos los municipios</option>
                {adminMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {municipioFilter && (
                <button onClick={() => { setMunicipioFilter(''); setPage(1) }}
                  className="btn-ghost text-xs px-1.5 py-1" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <input type="month" value={mesFiltro}
              onChange={(e) => { setMesFiltro(e.target.value); setPage(1) }}
              className="input" style={{ fontSize: '0.8rem', maxWidth: 170 }} title="Filtrar por periodo (mes de cargue)" />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }}>
              Limpiar
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-title">Sin registros</div>
            <div className="empty-desc">No se encontraron afiliadas para esta IPS.</div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.map((u, i) => {
                const nombre = [u.nombre1, u.nombre2].filter(Boolean).join(' ')
                const apellido = [u.apellido1, u.apellido2].filter(Boolean).join(' ')
                const ini = (u.apellido1 || u.nombre1 || '?').slice(0, 1).toUpperCase()
                return (
                  <div key={`${u.numero_id}-${i}`}
                    className="panel cursor-pointer transition-all duration-200"
                    style={{ borderLeft: '3px solid var(--primary)', padding: '1rem 1.25rem' }}
                    onClick={() => startEdit(u)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(90,174,90,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-700)' }}>
                        {ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {apellido} / {nombre}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                            {u.tipo_id} · {u.numero_id}
                          </span>
                          {u.municipio && (
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                              {u.municipio}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
                          {u.fum && <span>FUM: {u.fum}</span>}
                          {u.fpp && <span>FPP: {u.fpp}</span>}
                        </div>
                      </div>
                      <svg className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
            {pTotal > 1 && (
              <div className="flex items-center justify-between px-4 py-3 mt-4 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
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
    const allKeys = ipsRows.length > 0 ? Object.keys(ipsRows[0]) : []
    const municipioKey = allKeys.find(k => k.toUpperCase() === 'MUNICIPIO_DE_RESIDENCIA')
      || allKeys.find(k => k.toUpperCase().includes('MUNICIPIO'))
      || ipsColumns.find(c => c.toUpperCase().includes('MUNICIPIO'))
      || 'MUNICIPIO_DE_RESIDENCIA'
    const municipios = [...new Set(ipsRows.map(r => r[municipioKey]).filter(v => v && String(v).trim()))].sort()
    const filtered = ipsRows.filter(r => {
      if (municipioFilter && r[municipioKey] !== municipioFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (r.NO_DE_IDENTIFICACION || '').toLowerCase().includes(q) ||
             (r.APELLIDO_1 || '').toLowerCase().includes(q) ||
             (r.NOMBRE_1 || '').toLowerCase().includes(q) ||
             (r.APELLIDO_2 || '').toLowerCase().includes(q) ||
             (r.NOMBRE_2 || '').toLowerCase().includes(q)
    })
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
        <div className="panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="page-title" style={{ fontSize: '1.1rem' }}>Gestion de data</div>
                <div className="page-subtitle">
                  {ipsLoading ? 'Cargando gestantes...' :
                   municipioFilter ? `${filtered.length} gestante${filtered.length !== 1 ? 's' : ''} en ${municipioFilter}` :
                   `${filtered.length} gestante${filtered.length !== 1 ? 's' : ''} registrada${filtered.length !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadIpsExcel(ipsUserName, filtered)} disabled={downloadingIps === ipsUserName}
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
        </div>

        {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

        {/* Barra de busqueda + filtro municipio */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Buscar por documento, apellido o nombre..." className="input pl-9" />
          </div>
          {municipios.length > 0 && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select value={municipioFilter} onChange={(e) => { setMunicipioFilter(e.target.value); setPage(1) }}
                className="select" style={{ fontSize: '0.8rem', minWidth: '180px' }}>
                <option value="">Todos los municipios</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {municipioFilter && (
                <button onClick={() => { setMunicipioFilter(''); setPage(1) }}
                  className="btn-ghost text-xs px-1.5 py-1" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <input type="month" value={mesFiltro}
              onChange={(e) => { setMesFiltro(e.target.value); setPage(1); loadIpsData(e.target.value) }}
              className="input" style={{ fontSize: '0.8rem', maxWidth: 170 }} title="Filtrar por periodo (mes de cargue)" />
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
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="empty-title">Sin resultados</div>
            <div className="empty-desc">
              {search ? 'No se encontraron gestantes con ese criterio.' : 'No hay gestantes registradas para tu IPS.'}
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.map((r, i) => {
                const nombre = [r.NOMBRE_1, r.NOMBRE_2].filter(Boolean).join(' ')
                const apellido = [r.APELLIDO_1, r.APELLIDO_2].filter(Boolean).join(' ')
                const ini = (r.APELLIDO_1 || r.NOMBRE_1 || '?').slice(0, 1).toUpperCase()
                return (
                  <div key={`${r.NO_DE_IDENTIFICACION}-${i}`}
                    className="panel cursor-pointer transition-all duration-200"
                    style={{ borderLeft: '3px solid var(--primary)', padding: '1rem 1.25rem' }}
                    onClick={() => startEdit(r)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(90,174,90,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-700)' }}>
                        {ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {apellido} / {nombre}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                            {r.NO_DE_IDENTIFICACION || '—'}
                          </span>
                          {r[municipioKey] && (
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>
                              {r[municipioKey]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
                          {r.FUM && <span>FUM: {fmtDate(r.FUM)}</span>}
                          {r.FPP && <span>FPP: {fmtDate(r.FPP)}</span>}
                          {r.EDAD_ANOS && <span>{r.EDAD_ANOS} años</span>}
                        </div>
                      </div>
                      <svg className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Paginacion */}
            {pTotal > 1 && (
              <div className="flex items-center justify-between px-4 py-3 mt-4 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Pagina {page} de {pTotal} · {filtered.length} registros
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
