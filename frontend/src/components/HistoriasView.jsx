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

  const load = async () => {
    setLoading(true); setError('')
    try { setHistorias(await fetchHistorias('', templateKey)) }
    catch (e) { setError('No fue posible cargar las historias clínicas.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [templateKey])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return historias
    return historias.filter((h) =>
      `${h.filename} ${h.paciente_nombre ?? ''} ${h.paciente_documento ?? ''} ${h.prestador ?? ''}`.toLowerCase().includes(q)
    )
  }, [historias, query])

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

  const handleSubmit = async () => {
    if (!file) { setError('Selecciona un archivo PDF para subir.'); return }
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
        <div className="page-title">Historias clínicas</div>
        <div className="page-subtitle">{isAdmin ? 'Consulta de expedientes clínicos de las usuarias.' : 'Sube las historias clínicas de tus usuarias.'}</div>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}
      {message && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--success)', backgroundColor: 'var(--primary-light)' }}>{message}</div>}

      {/* Carga de historia */}
      <div className="panel space-y-4">
        <div className="section-label">Subir historia clínica</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Documento de la usuaria</label>
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej: 1065800123" className="input" />
          </div>
          <div>
            <label className="form-label">Nombre de la usuaria</label>
            <input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Ej: María Fernanda López" className="input" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer border border-dashed"
            style={{ borderColor: 'var(--border)' }}>
            <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className="flex-1 min-w-0">
              <span className="block text-sm truncate">{file ? file.name : 'Seleccionar PDF...'}</span>
              <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>{file ? formatBytes(file.size) : 'Solo PDF · máx. ~4.5 MB'}</span>
            </span>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handlePickFile} />
          </label>
          <button onClick={handleSubmit} disabled={uploading || !file} className="btn-primary">
            {uploading ? 'Subiendo...' : 'Subir historia'}
          </button>
        </div>
      </div>

      {/* Búsqueda y listado */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por paciente, documento o archivo..." className="input pl-9" />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{filtered.length} historias</span>
        </div>

        {loading ? (
          <div className="space-y-2"><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="empty-title">Sin historias clínicas</div>
            <div className="empty-desc">No se encontraron historias para la búsqueda o la plantilla seleccionada.</div>
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
                    {isAdmin && <td style={{ color: 'var(--text-secondary)' }}>{h.prestador || '—'}</td>}
                    <td className="font-medium">{h.paciente_nombre || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{h.paciente_documento || '—'}</td>
                    <td>{h.filename}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatBytes(h.file_size)}</td>
                    <td className="text-right">
                      <button onClick={() => openPdf(h.id)} className="btn-ghost text-xs">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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