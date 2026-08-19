import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import { uploadHistoria, fetchHistorias, HISTORIA_URL } from '../api'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function HistoriasView() {
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
    setLoading(true)
    try {
      setHistorias(await fetchHistorias())
    } catch (e) {
      setError(e.message || 'Error al cargar las historias clínicas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
      setError('Solo se permiten archivos PDF.')
      setFile(null)
      return
    }
    if (f.size > 4.5 * 1024 * 1024) {
      setError('El archivo supera ~4.5 MB (límite de subida en el entorno desplegado). Divide la historia en partes menores.')
      setFile(null)
      return
    }
    setError('')
    setMessage(null)
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Selecciona un archivo PDF para subir.')
      return
    }
    setUploading(true); setError(''); setMessage(null)
    try {
      await uploadHistoria(file, { documento: documento.trim(), nombre: paciente.trim() })
      setMessage(`Historia clínica "${file.name}" subida correctamente.`)
      setFile(null); setDocumento(''); setPaciente('')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (e) {
      setError(e.message || 'Error al subir la historia clínica')
    } finally {
      setUploading(false)
    }
  }

  const openPdf = (id) => {
    window.open(HISTORIA_URL(id), '_blank', 'noopener')
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-md shadow-brand-900/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-ink tracking-tight">Historias clínicas</h2>
          <p className="text-xs text-ink-muted/60 mt-0.5">
            {isAdmin ? 'Consulta de expedientes clínicos de las usuarias' : 'Sube las historias clínicas de tus usuarias (PDF)'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {message}
        </div>
      )}

      {/* Formulario de carga */}
      <section className="rounded-2xl bg-white dark:bg-[#161618] border border-ink-line/60 dark:border-[#26262A] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/25 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-700 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink dark:text-white">Subir historia clínica</h3>
            <p className="text-xs text-ink-faint">Selecciona el archivo PDF, registra la usuaria y súbelo</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-[0.6rem] font-bold text-ink-faint uppercase tracking-wider mb-1 block">Documento de la usuaria</label>
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej: 1065800123"
              className="input" />
          </div>
          <div>
            <label className="text-[0.6rem] font-bold text-ink-faint uppercase tracking-wider mb-1 block">Nombre de la usuaria</label>
            <input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Ej: María Fernanda López"
              className="input" />
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-3">
          <label className="flex-1 flex items-center gap-3 rounded-xl border-2 border-dashed border-ink-line/70 dark:border-[#555558] bg-[#F7F7F8] dark:bg-[#121214] px-4 py-3 cursor-pointer hover:border-brand-400/60 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/25 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink dark:text-white truncate">
                {file ? file.name : 'Seleccionar PDF…'}
              </span>
              <span className="block text-[0.6rem] text-ink-faint">
                {file ? formatBytes(file.size) : 'Solo PDF · máx. ~4.5 MB'}
              </span>
            </span>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handlePickFile} />
          </label>
          <button onClick={handleSubmit} disabled={uploading || !file}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 hover:bg-brand-900 dark:bg-brand-600 dark:hover:bg-brand-500 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-brand-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Subiendo…
              </>
            ) : (
              <>Subir historia</>
            )}
          </button>
        </div>
      </section>

      {/* Lista */}
      <section className="rounded-2xl bg-white dark:bg-[#161618] border border-ink-line/60 dark:border-[#26262A] overflow-hidden">
        <div className="p-4 border-b border-ink-line/60 dark:border-[#26262A] flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por usuaria, documento o archivo…" className="input pl-9" />
          </div>
          <span className="text-xs text-ink-faint md:ml-auto">
            {filtered.length} historia{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#F3F3F4] dark:bg-[#1D1D20] border-b border-ink-line/60 dark:border-[#26262A] text-left">
                <th className="px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Fecha</th>
                {isAdmin && <th className="px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Prestador</th>}
                <th className="px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Usuaria</th>
                <th className="px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Documento</th>
                <th className="px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Archivo</th>
                <th className="px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Tamaño</th>
                <th className="px-4 py-2.5 text-right text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} className="border-b border-ink-line/40 dark:border-[#26262A]/60 last:border-0 hover:bg-brand-50/40 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-faint">{new Date(h.created_at).toLocaleDateString('es-CO')}</td>
                  {isAdmin && <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-muted">{h.prestador || '—'}</td>}
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/25 flex items-center justify-center text-brand-700 dark:text-brand-300 text-[0.6rem] font-bold uppercase shrink-0">
                        {(h.paciente_nombre || '?').slice(0, 2)}
                      </span>
                      <span className="text-sm font-semibold text-ink dark:text-white truncate">{h.paciente_nombre || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-muted">{h.paciente_documento || '—'}</td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/25 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span className="text-sm font-medium text-ink dark:text-white truncate max-w-[200px]">{h.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-faint">{formatBytes(h.file_size)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openPdf(h.id)}
                      className="inline-flex items-center gap-1.5 text-[0.6rem] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider hover:text-brand-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="px-6 py-10 text-center text-sm text-ink-faint">
            No hay historias clínicas registradas todavía.
          </div>
        )}
        {loading && (
          <div className="px-6 py-10 text-center text-sm text-ink-faint">Cargando historias…</div>
        )}
      </section>
    </div>
  )
}