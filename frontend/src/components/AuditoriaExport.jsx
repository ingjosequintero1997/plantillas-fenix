import { useState, useRef } from 'react'
import { uploadFile, fetchTemplates, DOWNLOAD_TEMPLATE_URL } from '../api'
import { generateExcel } from '../excelGenerator'

export default function AuditoriaExport({ onClose }) {
  const [templates, setTemplates] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef()

  useState(() => {
    fetchTemplates().then(data => {
      setTemplates(data)
      if (data.length) setSelectedKey(data[0].key)
    }).catch(() => setError('Error al cargar plantillas'))
  })

  const handleProcess = async () => {
    if (!file || !selectedKey) return
    setLoading(true); setError(''); setProgress(0); setResult(null)
    try {
      const data = await uploadFile(file, selectedKey, setProgress, {
        strictMode: false, minTemplateCoverage: 0, requireExactColumns: false,
      })
      const rawText = data.corrected_text || ''
      const templateNames = data.template_names || []
      const df = []
      const lines = rawText.split('\n').filter(Boolean)
      for (const line of lines) {
        const cells = line.split('|')
        const row = {}
        templateNames.forEach((name, i) => { row[name] = cells[i] || '' })
        df.push(row)
      }
      setResult({
        indicators: [],
        patients: df,
        data_columns: templateNames,
        eval_columns: [],
        total_patients: df.length,
        template_key: selectedKey,
        templateNames,
        summary: data.summary,
        fileName: file.name,
      })
    } catch (e) {
      setError(e.message || 'Error al procesar archivo')
    } finally {
      setLoading(false); setProgress(100)
    }
  }

  const handleDownload = () => {
    if (!result) return
    try {
      const blob = generateExcel({
        indicators: [],
        patients: result.patients,
        data_columns: result.data_columns,
        eval_columns: [],
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_${selectedKey}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Error al generar Excel')
    }
  }

  const formatBytes = (b) => {
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="card overflow-hidden relative animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-white to-white pointer-events-none" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-600 via-violet-400 to-violet-300" />

      {/* Header */}
      <div className="relative px-7 py-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-violet-50 rounded-full px-3 py-1 mb-2 ring-1 ring-violet-200/50">
            <div className="w-2 h-2 rounded-full bg-violet-600" />
            <span className="text-[0.55rem] font-bold text-violet-800 tracking-[0.15em] uppercase">Auditoría</span>
          </div>
          <h2 className="text-xl font-extrabold text-ink tracking-tight">
            Exportar a Excel organizado
          </h2>
          <p className="text-xs text-ink-muted mt-1 max-w-lg">
            Carga el TXT del sistema de validación, selecciona la plantilla y descarga un Excel con los encabezados organizados para revisión de auditoría.
          </p>
        </div>
        <button onClick={onClose}
          className="btn bg-white text-ink border border-ink-line/70 hover:bg-surface-50 shadow-button shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cerrar
        </button>
      </div>

      {/* Body */}
      <div className="relative px-7 pb-7 space-y-5">
        {/* Step 1: Select template */}
        <div className="rounded-xl border border-ink-line/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[0.5rem] font-bold flex items-center justify-center shrink-0">1</span>
            <span className="text-sm font-bold text-ink">Seleccionar plantilla</span>
          </div>
          <select value={selectedKey} onChange={e => setSelectedKey(e.target.value)}
            className="select w-full max-w-sm">
            <option value="">— Selecciona —</option>
            {templates.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Upload file */}
        <div className="rounded-xl border border-ink-line/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[0.5rem] font-bold flex items-center justify-center shrink-0">2</span>
            <span className="text-sm font-bold text-ink">Cargar archivo TXT</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => inputRef.current?.click()}
              className="btn-outline text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Seleccionar archivo
            </button>
            <input ref={inputRef} type="file" accept=".txt" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); setError('') } }} />
            {file && (
              <span className="text-xs text-ink-muted flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {file.name} ({formatBytes(file.size)})
              </span>
            )}
          </div>
          <div className="text-[0.5rem] text-ink-faint font-medium uppercase tracking-wider">
            Formatos aceptados: .txt (pipe separado | )
          </div>
        </div>

        {/* Step 3: Process */}
        <div className="rounded-xl border border-ink-line/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[0.5rem] font-bold flex items-center justify-center shrink-0">3</span>
            <span className="text-sm font-bold text-ink">Procesar y exportar</span>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <svg className="w-4 h-4 text-violet-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Procesando... {progress}%
            </div>
          )}

          {!loading && (
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleProcess} disabled={!file || !selectedKey}
                className="btn-primary text-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Procesar
              </button>
              {result && (
                <button onClick={handleDownload}
                  className="btn bg-violet-600 text-white hover:bg-violet-700 shadow-button hover:shadow-button-hover text-xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar Excel organizado
                </button>
              )}
            </div>
          )}
        </div>

        {/* Result summary */}
        {result?.summary && (
          <div className="rounded-xl border border-ink-line/60 bg-surface-50/70 p-4 text-xs text-ink grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[0.5rem] uppercase tracking-wider text-ink-muted font-semibold">Registros</span>
              <div className="font-bold text-lg">{result.summary.total}</div>
            </div>
            <div>
              <span className="text-[0.5rem] uppercase tracking-wider text-ink-muted font-semibold">Errores</span>
              <div className={`font-bold text-lg ${result.summary.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>{result.summary.errors}</div>
            </div>
            <div>
              <span className="text-[0.5rem] uppercase tracking-wider text-ink-muted font-semibold">Corregidos</span>
              <div className="font-bold text-lg text-amber-600">{result.summary.corrected}</div>
            </div>
            <div>
              <span className="text-[0.5rem] uppercase tracking-wider text-ink-muted font-semibold">Calidad</span>
              <div className="font-bold text-lg text-brand-700">{result.summary.quality_percent}%</div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-xs text-red-600 flex items-start gap-2">
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
