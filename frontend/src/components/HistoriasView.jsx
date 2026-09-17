import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { fetchHistorias, downloadHistoriaPdf, deleteHistoria } from '../api'
import JSZip from 'jszip'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(s) {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return s }
}

export default function HistoriasView({ templateKey = 'gestante' }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isIps = user?.role === 'ips_user'

  const [historias, setHistorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(null)

  const [selectedIps, setSelectedIps] = useState(null)
  const [ipsSearch, setIpsSearch] = useState('')
  const [search, setSearch] = useState('')

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedHistoria, setSelectedHistoria] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [downloadingZip, setDownloadingZip] = useState(false)

  const load = async () => {
    setLoading(true); setError('')
    try { setHistorias(await fetchHistorias('', templateKey)) }
    catch (e) { setError('No fue posible cargar las historias clinicas.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [templateKey])

  // IPS groups (for admin)
  const byIps = useMemo(() => {
    const groups = {}
    for (const h of historias) {
      const ips = h.ips_name || 'Sin IPS'
      if (!groups[ips]) groups[ips] = []
      groups[ips].push(h)
    }
    return groups
  }, [historias])

  const ipsNames = useMemo(() => Object.keys(byIps).sort(), [byIps])

  const filteredIpsNames = useMemo(() => {
    if (!ipsSearch.trim()) return ipsNames
    const q = ipsSearch.trim().toLowerCase()
    return ipsNames.filter(n => n.toLowerCase().includes(q))
  }, [ipsNames, ipsSearch])

  // Patients for current IPS selection (or all for IPS user)
  const currentPatients = useMemo(() => {
    const items = selectedIps ? (byIps[selectedIps] || []) : historias
    const byPaciente = {}
    for (const h of items) {
      const key = h.paciente_documento || `nodoc_${h.id}`
      if (!byPaciente[key]) {
        byPaciente[key] = {
          documento: h.paciente_documento,
          tipo_documento: h.tipo_documento || 'CC',
          nombre: h.paciente_nombre || 'Sin nombre',
          historias: []
        }
      }
      byPaciente[key].historias.push(h)
    }
    return Object.values(byPaciente)
  }, [selectedIps, byIps, historias])

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return currentPatients
    const q = search.trim().toLowerCase()
    return currentPatients.filter(p =>
      `${p.documento} ${p.nombre} ${p.tipo_documento}`.toLowerCase().includes(q)
    )
  }, [currentPatients, search])

  const pdfUrlRef = useRef(null)
  const abortRef = useRef(null)

  const cleanupPdf = useCallback(() => {
    if (pdfUrlRef.current) { URL.revokeObjectURL(pdfUrlRef.current); pdfUrlRef.current = null }
    setPdfUrl(null)
  }, [])

  const loadPdf = useCallback(async (h) => {
    if (abortRef.current) abortRef.current.abort()
    if (!h) { cleanupPdf(); setSelectedHistoria(null); return }
    const controller = new AbortController()
    abortRef.current = controller
    setPdfLoading(true); setError('')
    try {
      cleanupPdf()
      const url = await downloadHistoriaPdf(h.id)
      if (controller.signal.aborted) { URL.revokeObjectURL(url); return }
      pdfUrlRef.current = url
      setPdfUrl(url)
      setSelectedHistoria(h)
    } catch (e) {
      if (!controller.signal.aborted) setError('Error al cargar vista previa: ' + e.message)
    } finally {
      if (!controller.signal.aborted) setPdfLoading(false)
    }
  }, [cleanupPdf])

  useEffect(() => {
    if (selectedPatient && selectedPatient.historias.length > 0) {
      loadPdf(selectedPatient.historias[0])
    } else {
      loadPdf(null)
    }
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [selectedPatient])

  const handleDownload = async (h) => {
    setDownloadingId(h.id)
    try {
      const url = await downloadHistoriaPdf(h.id)
      const a = document.createElement('a'); a.href = url
      const tipo = h.tipo_documento || 'CC'
      const doc = h.paciente_documento || 'nodoc'
      a.download = `${tipo}_${doc}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError('Error al descargar: ' + e.message) }
    finally { setDownloadingId(null) }
  }

  const handleDelete = async (h) => {
    if (!window.confirm(`Eliminar historia clinica de ${h.paciente_nombre || 'esta paciente'}? Esta accion no se puede deshacer.`)) return
    setDeletingId(h.id); setError(''); setMessage(null)
    try {
      await deleteHistoria(h.id)
      cleanupPdf(); setSelectedHistoria(null)
      setMessage('Historia eliminada correctamente.')
      await load()
    } catch (e) { setError('No fue posible eliminar la historia.') }
    finally { setDeletingId(null) }
  }

  const handleBulkDownload = async () => {
    const patients = selectedIps ? currentPatients : filteredPatients
    if (patients.length === 0) return
    setDownloadingZip(true); setError('')
    try {
      const zip = new JSZip()
      const safeIps = (selectedIps || 'TODAS').replace(/[^a-zA-Z0-9 ]/g, '_').trim()
      for (const p of patients) {
        const tipo = p.tipo_documento || 'CC'
        const doc = p.documento || 'nodoc'
        const folderPath = `${tipo}_${doc}`
        for (const h of p.historias) {
          try {
            const blobUrl = await downloadHistoriaPdf(h.id)
            const resp = await fetch(blobUrl)
            const pdfBuffer = await resp.arrayBuffer()
            zip.file(`${safeIps}/${folderPath}/${tipo}_${doc}.pdf`, pdfBuffer)
            URL.revokeObjectURL(blobUrl)
          } catch (e) {
            zip.file(`${safeIps}/${folderPath}/ERROR.txt`, `No se pudo descargar: ${e.message}`)
          }
        }
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a'); a.href = url
      a.download = `Historias_${safeIps}_${new Date().toISOString().slice(0, 10)}.zip`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError('Error al generar ZIP: ' + e.message) }
    finally { setDownloadingZip(false) }
  }

  const handleBack = () => {
    setSelectedIps(null); setSelectedPatient(null); setSearch('')
    setError(''); setMessage(null); loadPdf(null)
  }

  const handleBackToPatients = () => {
    setSelectedPatient(null); setError(''); setMessage(null)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--green-100)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.1rem' }}>Historias clinicas</h1>
            <p className="page-subtitle">Cargando...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  // ── Admin: IPS grid (step 1) ──
  if (isAdmin && !selectedIps) {
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--green-100)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.1rem' }}>Historias clinicas</h1>
            <p className="page-subtitle">Selecciona una IPS para ver las historias clinicas.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(180,35,24,0.1)' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            {error}
          </div>
        )}

        <div className="panel">
          <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={ipsSearch} onChange={(e) => setIpsSearch(e.target.value)} placeholder="Buscar IPS..." className="input" style={{ paddingLeft: '36px' }} />
            </div>
            <span className="text-xs ml-auto font-medium" style={{ color: 'var(--text-muted)' }}>{filteredIpsNames.length} IPS</span>
          </div>

          {filteredIpsNames.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
              <div className="empty-title">Sin historias clinicas</div>
              <div className="empty-desc">No se encontraron historias clinicas asociadas a ninguna IPS.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIpsNames.map((ipsName) => {
                const items = byIps[ipsName]
                const pacientes = new Set(items.map(h => h.paciente_documento).filter(Boolean))
                return (
                  <button key={ipsName} onClick={() => { setSelectedIps(ipsName); setSelectedPatient(null) }}
                    className="panel text-left hover:shadow-md transition-all" style={{ cursor: 'pointer', borderLeft: '3px solid var(--green-500)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-100)' }}>
                        <svg className="w-5 h-5" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ipsName}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {pacientes.size} paciente{pacientes.size !== 1 ? 's' : ''} · {items.length} historias
                        </div>
                      </div>
                      <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Split panel: patient sidebar + PDF preview ──
  const showPatientList = !selectedPatient
  const patientsToShow = filteredPatients
  const currentIpsLabel = selectedIps || (isIps ? (historias[0]?.ips_name || 'Mis historias') : 'Todas')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '500px' }}>
      {/* Header */}
      <div className="panel" style={{ borderLeft: '4px solid var(--green-500)', flexShrink: 0, padding: '0.75rem 1.25rem' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedIps && isAdmin ? (
              <button onClick={handleBack} className="btn-ghost px-2 py-1" style={{ minWidth: 'auto' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            ) : isIps && selectedPatient ? (
              <button onClick={handleBackToPatients} className="btn-ghost px-2 py-1" style={{ minWidth: 'auto' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            ) : null}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-100)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{currentIpsLabel}</div>
              <div className="text-[0.7rem]" style={{ color: 'var(--text-secondary)' }}>
                {patientsToShow.length} paciente{patientsToShow.length !== 1 ? 's' : ''} · {patientsToShow.reduce((a, p) => a + p.historias.length, 0)} historias
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {patientsToShow.length > 0 && (
              <button onClick={handleBulkDownload} disabled={downloadingZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.7rem] font-semibold transition-all"
                style={{ color: '#fff', backgroundColor: downloadingZip ? 'var(--text-muted)' : '#5aae5a', border: 'none', cursor: downloadingZip ? 'not-allowed' : 'pointer' }}>
                {downloadingZip ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> ZIP...</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> ZIP</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm mt-2" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(180,35,24,0.1)', flexShrink: 0 }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm mt-2" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid rgba(90,174,90,0.15)', flexShrink: 0 }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {message}
        </div>
      )}

      {/* Split panel body */}
      <div style={{ display: 'flex', flex: 1, gap: '12px', marginTop: '8px', minHeight: 0, overflow: 'hidden' }}>
        {/* LEFT SIDEBAR — Patient list */}
        <div style={{
          width: selectedPatient ? '320px' : '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          transition: 'width 200ms ease'
        }}>
          {/* Search bar */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente..." className="input" style={{ paddingLeft: '36px', fontSize: '0.8rem', padding: '6px 12px 6px 36px' }} />
            </div>
          </div>

          {/* Patient list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {patientsToShow.length === 0 ? (
              <div className="empty" style={{ padding: '2rem 1rem' }}>
                <div className="empty-title" style={{ fontSize: '0.85rem' }}>Sin pacientes</div>
                <div className="empty-desc" style={{ fontSize: '0.75rem' }}>No se encontraron pacientes con historias clinicas.</div>
              </div>
            ) : (
              patientsToShow.map((p) => {
                const isSelected = selectedPatient && selectedPatient.documento === p.documento
                return (
                  <button key={p.documento || p.nombre}
                    onClick={() => setSelectedPatient(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1.5px solid var(--green-400)' : '1.5px solid transparent',
                      backgroundColor: isSelected ? 'var(--green-50)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 120ms ease'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isSelected ? 'var(--green-200)' : 'var(--green-100)', color: 'var(--green-600)' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8rem] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.nombre}</div>
                      <div className="text-[0.65rem] flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span>{p.tipo_documento} {p.documento || '—'}</span>
                        <span>·</span>
                        <span>{p.historias.length} PDF{p.historias.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--green-500)' }} />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL — PDF Preview / Metadata */}
        {selectedPatient ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {/* Patient info bar */}
            <div className="panel" style={{ flexShrink: 0, padding: '10px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-100)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedPatient.nombre}</span>
                  <span className="text-[0.65rem] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    {selectedPatient.tipo_documento} {selectedPatient.documento || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {selectedPatient.historias.map((h) => (
                    <button key={h.id}
                      onClick={() => loadPdf(h)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.65rem', fontWeight: 500, cursor: 'pointer', transition: 'all 120ms ease',
                        backgroundColor: selectedHistoria?.id === h.id ? 'var(--green-500)' : 'var(--green-50)',
                        color: selectedHistoria?.id === h.id ? '#fff' : 'var(--green-700)',
                        border: `1px solid ${selectedHistoria?.id === h.id ? 'var(--green-500)' : 'var(--green-200)'}`
                      }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      {h.filename || `Historia ${h.id}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedHistoria && (
                  <>
                    <button onClick={() => handleDownload(selectedHistoria)} disabled={downloadingId === selectedHistoria.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.7rem] font-medium transition-all"
                      style={{ color: 'var(--green-700)', border: '1px solid var(--green-200)', backgroundColor: 'var(--green-50)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--green-500)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--green-50)'; e.currentTarget.style.color = 'var(--green-700)' }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {downloadingId === selectedHistoria.id ? '...' : 'Descargar'}
                    </button>
                    {(isAdmin || isIps) && (
                      <button onClick={() => handleDelete(selectedHistoria)} disabled={deletingId === selectedHistoria.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.7rem] font-medium transition-all"
                        style={{ color: 'var(--danger)', border: '1px solid rgba(180,35,24,0.2)', backgroundColor: 'rgba(180,35,24,0.04)', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--danger)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(180,35,24,0.04)'; e.currentTarget.style.color = 'var(--danger)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {deletingId === selectedHistoria.id ? '...' : 'Eliminar'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* PDF viewer + metadata side by side */}
            <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
              {/* PDF iframe */}
              <div style={{
                flex: 1, minWidth: 0,
                backgroundColor: '#f5f5f5',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {pdfLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-6 h-6 animate-spin" style={{ color: 'var(--green-500)' }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cargando PDF...</span>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    title="Vista previa PDF"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10" style={{ color: 'var(--warm-300)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Selecciona un paciente para vista previa</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata panel */}
              {selectedHistoria && (
                <div style={{
                  width: '240px', flexShrink: 0,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px',
                  overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                  <div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Archivo</div>
                    <div className="text-[0.8rem] font-semibold break-words" style={{ color: 'var(--text-primary)' }}>{selectedHistoria.filename || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Tamano</div>
                    <div className="text-[0.8rem]" style={{ color: 'var(--text-primary)' }}>{formatBytes(selectedHistoria.file_size)}</div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Fecha de carga</div>
                    <div className="text-[0.8rem]" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedHistoria.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Tipo de documento</div>
                    <div className="text-[0.8rem]" style={{ color: 'var(--text-primary)' }}>{selectedHistoria.tipo_documento || 'CC'}</div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>IPS</div>
                    <div className="text-[0.8rem] break-words" style={{ color: 'var(--text-primary)' }}>{selectedHistoria.ips_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>ID Historia</div>
                    <div className="text-[0.75rem] font-mono" style={{ color: 'var(--text-secondary)' }}>#{selectedHistoria.id}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state when no patient selected */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="flex flex-col items-center gap-4" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-center">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Selecciona un paciente</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Haz clic en un paciente de la izquierda para ver su PDF</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
