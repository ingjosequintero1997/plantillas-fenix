import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import { uploadHistoria, fetchHistorias, HISTORIA_URL } from '../api'

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
  const [paciente, setPaciente] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState('')
  const [historias, setHistorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [mes, setMes] = useState('all')
  const [dragOver, setDragOver] = useState(false)

  const load = async () => {
    setLoading(true); setError('')
    try { setHistorias(await fetchHistorias('', templateKey)) }
    catch (e) { setError('No fue posible cargar las historias clínicas.') }
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
      return `${h.filename} ${h.paciente_nombre ?? ''} ${h.paciente_documento ?? ''} ${h.prestador ?? ''}`.toLowerCase().includes(q)
    })
  }, [historias, query, mes])

  const handlePickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF.'); setFile(null); return
    }
    if (f.size > 4.5 * 1024 * 1024) {
      setError('El archivo supera el límite de ~4.5 MB. Divide la historia en partes menores.'); setFile(null); return
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
      setError('El archivo supera el límite de ~4.5 MB.'); setFile(null); return
    }
    setError(''); setMessage(null); setFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { setError('Selecciona un archivo PDF para subir.'); return }
    if (!documento.trim()) { setError('El documento de la usuaria es obligatorio.'); return }
    setUploading(true); setError(''); setMessage(null)
    try {
      await uploadHistoria(file, { documento: documento.trim(), nombre: paciente.trim() }, templateKey)
      setMessage(`Historia clínica "${file.name}" subida correctamente.`)
      setFile(null); setDocumento(''); setPaciente('')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (e) { setError('No fue posible subir la historia clínica.') }
    finally { setUploading(false) }
  }

  const openPdf = (id) => window.open(HISTORIA_URL(id), '_blank', 'noopener')

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Historias clínicas</h1>
        <p className="page-subtitle">{isAdmin ? 'Consulta de expedientes clínicos de las usuarias.' : 'Sube las historias clínicas de tus usuarias.'}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(180,35,24,0.1)', boxShadow: '0 2px 8px rgba(180,35,24,0.06)' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid rgba(90,174,90,0.15)', boxShadow: '0 2px 8px rgba(90,174,90,0.06)' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {message}
        </div>
      )}

      {/* Formulario de carga */}
      <div className="card" style={{ boxShadow: '0 4px 16px rgba(28,28,26,0.06), 0 1px 4px rgba(90,174,90,0.04)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-4)' }}>Subir historia clínica</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <label className="form-label">
              Documento de la usuaria <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej: 1065800123" className="input" />
          </div>
          <div>
            <label className="form-label">Nombre de la usuaria</label>
            <input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Ej: María Fernanda López" className="input" />
          </div>
        </div>

        {/* Dropzone */}
        <label
          className="flex items-center gap-4 px-5 py-5 rounded-xl cursor-pointer transition-all duration-150"
          style={{
            border: `2px dashed ${dragOver ? 'var(--green-500)' : file ? 'var(--green-300)' : 'var(--border-strong)'}`,
            backgroundColor: dragOver ? 'var(--surface-brand-weak)' : file ? 'var(--green-50)' : 'var(--bg-canvas)',
            boxShadow: dragOver ? '0 4px 16px rgba(90,174,90,0.12)' : 'none',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-600)', boxShadow: '0 2px 8px rgba(90,174,90,0.12)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: file ? 'var(--green-700)' : 'var(--text-primary)' }}>
              {file ? file.name : 'Arrastra un PDF aquí o haz clic para seleccionar'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {file ? formatBytes(file.size) + ' · Haz clic para cambiar' : 'Solo archivos PDF · máximo ~4.5 MB'}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handlePickFile} />
        </label>

        <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-4)' }}>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {!documento.trim() && <span style={{ color: 'var(--accent-500)' }}>El documento es obligatorio</span>}
          </div>
          <button onClick={handleSubmit} disabled={uploading || !file} className="btn-primary">
            {uploading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Subiendo...</>
            ) : 'Subir historia'}
          </button>
        </div>
      </div>

      {/* Búsqueda y listado */}
      <div className="card" style={{ boxShadow: '0 4px 16px rgba(28,28,26,0.06), 0 1px 4px rgba(90,174,90,0.04)' }}>
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por paciente, documento o archivo..." className="input" style={{ paddingLeft: '36px' }} />
          </div>
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="select" style={{ width: '176px' }}>
            <option value="all">Todos los meses</option>
            {meses.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="text-xs ml-auto font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} historias</span>
        </div>

        {loading ? (
          <div className="space-y-2"><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="empty-title">Sin historias clínicas</div>
            <div className="empty-desc">No se encontraron historias para la búsqueda o plantilla seleccionada. Prueba con otros filtros o sube un nuevo archivo.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {isAdmin && <th>Prestador</th>}
                  <th>Usuaria</th>
                  <th>Documento</th>
                  <th>Archivo</th>
                  <th>Tamaño</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{new Date(h.created_at).toLocaleDateString('es-CO')}</td>
                    {isAdmin && <td style={{ color: 'var(--text-secondary)' }}>{h.prestador || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}</td>}
                    <td style={{ fontWeight: 'var(--weight-medium)' }}>{h.paciente_nombre || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin nombre</span>}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{h.paciente_documento || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td className="max-w-[200px] truncate">{h.filename}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatBytes(h.file_size)}</td>
                    <td className="text-right">
                      <button onClick={() => openPdf(h.id)} className="btn-ghost" style={{ fontSize: 'var(--text-caption)', padding: '4px 10px' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
