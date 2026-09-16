import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import { uploadHistoria, fetchHistorias, downloadHistoriaPdf, HISTORIA_URL } from '../api'
import JSZip from 'jszip'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function HistoriasView({ templateKey = 'gestante' }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [documento, setDocumento] = useState('')
  const [tipoDoc, setTipoDoc] = useState('CC')
  const [paciente, setPaciente] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState('')
  const [historias, setHistorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [mes, setMes] = useState('all')
  const [dragOver, setDragOver] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try { setHistorias(await fetchHistorias('', templateKey)) }
    catch (e) { setError('No fue posible cargar las historias clinicas.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [templateKey])

  const meses = useMemo(() => {
    const set = new Set(historias.map((h) => h.created_at ? new Date(h.created_at).toISOString().slice(0, 7) : '').filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [historias])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return historias.filter((h) => {
      if (mes !== 'all' && h.created_at) {
        const hMes = new Date(h.created_at).toISOString().slice(0, 7)
        if (hMes !== mes) return false
      }
      if (!q) return true
      return `${h.filename} ${h.paciente_nombre ?? ''} ${h.paciente_documento ?? ''} ${h.prestador ?? ''} ${h.ips_name ?? ''}`.toLowerCase().includes(q)
    })
  }, [historias, query, mes])

  const handlePickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF.'); setFile(null); return
    }
    if (f.size > 4.5 * 1024 * 1024) {
      setError('El archivo supera el limite de ~4.5 MB.'); setFile(null); return
    }
    setError(''); setMessage(null); setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF.'); setFile(null); return
    }
    if (f.size > 4.5 * 1024 * 1024) {
      setError('El archivo supera el limite de ~4.5 MB.'); setFile(null); return
    }
    setError(''); setMessage(null); setFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { setError('Selecciona un archivo PDF para subir.'); return }
    if (!documento.trim()) { setError('El documento de la usuaria es obligatorio.'); return }
    setUploading(true); setError(''); setMessage(null)
    try {
      await uploadHistoria(file, { documento: documento.trim(), nombre: paciente.trim(), tipoDocumento: tipoDoc }, templateKey)
      setMessage(`Historia clinica "${file.name}" subida correctamente.`)
      setFile(null); setDocumento(''); setPaciente(''); setTipoDoc('CC')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (e) { setError('No fue posible subir la historia clinica.') }
    finally { setUploading(false) }
  }

  const handleDownload = async (h) => {
    setDownloadingId(h.id)
    try {
      const url = await downloadHistoriaPdf(h.id)
      const a = document.createElement('a')
      a.href = url
      const tipo = h.tipo_documento || 'CC'
      const doc = h.paciente_documento || 'nodoc'
      a.download = `${tipo}_${doc}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Error al descargar: ' + e.message)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleBulkDownload = async () => {
    if (filtered.length === 0) return
    setDownloadingZip(true); setError('')
    try {
      const zip = new JSZip()
      const byIps = {}
      for (const h of filtered) {
        const ips = h.ips_name || 'Sin IPS'
        if (!byIps[ips]) byIps[ips] = []
        byIps[ips].push(h)
      }
      for (const [ipsName, items] of Object.entries(byIps)) {
        const safeIps = ipsName.replace(/[^a-zA-Z0-9 ]/g, '_').trim()
        for (const h of items) {
          const tipo = h.tipo_documento || 'CC'
          const doc = h.paciente_documento || 'nodoc'
          const folderPath = `${safeIps}/${tipo}_${doc}`
          try {
            const blobUrl = await downloadHistoriaPdf(h.id)
            const resp = await fetch(blobUrl)
            const pdfBuffer = await resp.arrayBuffer()
            zip.file(`${folderPath}/${tipo}_${doc}.pdf`, pdfBuffer)
            URL.revokeObjectURL(blobUrl)
          } catch (e) {
            zip.file(`${folderPath}/ERROR.txt`, `No se pudo descargar: ${e.message}`)
          }
        }
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `Historias_Clinicas_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Error al generar ZIP: ' + e.message)
    } finally {
      setDownloadingZip(false)
    }
  }

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
          <p className="page-subtitle">{isAdmin ? 'Consulta y descarga de expedientes clinicos de todas las IPS.' : 'Sube las historias clinicas de tus usuarias.'}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(180,35,24,0.1)' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid rgba(90,174,90,0.15)' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {message}
        </div>
      )}

      <div className="panel" style={{ borderLeft: '4px solid var(--green-500)' }}>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" style={{ color: 'var(--green-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <div className="section-label" style={{ marginBottom: 0 }}>Subir historia clinica</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <label className="form-label">Tipo documento <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} className="input">
              <option value="CC">CC</option><option value="TI">TI</option><option value="RC">RC</option>
              <option value="CE">CE</option><option value="PT">PT</option><option value="MS">MS</option>
            </select>
          </div>
          <div>
            <label className="form-label">No. Documento <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej: 1065800123" className="input" />
          </div>
          <div>
            <label className="form-label">Nombre de la usuaria</label>
            <input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Ej: Maria Fernandez Lopez" className="input" />
          </div>
        </div>
        <label className="flex items-center gap-4 px-5 py-5 rounded-xl cursor-pointer transition-all"
          style={{ border: `2px dashed ${dragOver ? 'var(--green-500)' : file ? 'var(--green-300)' : 'var(--border-strong)'}`, backgroundColor: dragOver ? 'var(--green-50)' : file ? 'var(--green-50)' : 'var(--bg-canvas)' }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: file ? 'var(--green-100)' : 'var(--bg-subtle)', color: file ? 'var(--green-600)' : 'var(--text-muted)' }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: file ? 'var(--green-700)' : 'var(--text-primary)' }}>
              {file ? file.name : 'Arrastra un PDF aqui o haz clic para seleccionar'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {file ? formatBytes(file.size) + ' · Haz clic para cambiar' : 'Solo archivos PDF · maximo ~4.5 MB'}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handlePickFile} />
        </label>
        <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-4)' }}>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {!documento.trim() && <span style={{ color: 'var(--accent-500)' }}>El documento es obligatorio</span>}
          </div>
          <button onClick={handleSubmit} disabled={uploading || !file} className="btn-primary">
            {uploading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Subiendo...</>) : 'Subir historia'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por paciente, documento, IPS..." className="input" style={{ paddingLeft: '36px' }} />
          </div>
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="input" style={{ width: '176px' }}>
            <option value="all">Todos los meses</option>
            {meses.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
          {isAdmin && filtered.length > 0 && (
            <button onClick={handleBulkDownload} disabled={downloadingZip}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ color: '#fff', backgroundColor: downloadingZip ? 'var(--text-muted)' : '#5aae5a', border: 'none', cursor: downloadingZip ? 'not-allowed' : 'pointer' }}>
              {downloadingZip ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generando ZIP...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Descargar todo (.zip)</>
              )}
            </button>
          )}
          <span className="text-xs ml-auto font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} historias</span>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
            <div className="empty-title">Sin historias clinicas</div>
            <div className="empty-desc">No se encontraron historias para la busqueda seleccionada.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((h) => (
              <div key={h.id} className="panel transition-all duration-200"
                style={{ padding: '1rem 1.25rem', borderLeft: '3px solid var(--green-500)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(90,174,90,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-600)' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{h.paciente_nombre || 'Sin nombre'}</span>
                      {h.ips_name && (
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)' }}>{h.ips_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[0.7rem] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                        {h.tipo_documento || 'CC'} {h.paciente_documento || '—'}
                      </span>
                      <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>{h.filename}</span>
                      <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>{formatBytes(h.file_size)}</span>
                      {h.created_at && <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleDateString('es-CO')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(h)} disabled={downloadingId === h.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{ color: 'var(--green-700)', border: '1px solid var(--green-200)', backgroundColor: 'var(--green-50)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--green-500)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--green-50)'; e.currentTarget.style.color = 'var(--green-700)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {downloadingId === h.id ? '...' : 'Descargar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
