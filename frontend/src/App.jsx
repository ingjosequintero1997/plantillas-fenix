import React, { useMemo, useState, useEffect } from 'react'
import DragDrop from './components/DragDrop'
import MappingEditor from './components/MappingEditor'
import DataGridTable from './components/DataGridTable'
import StatsCard from './components/StatsCard'
import EvaluationDashboard from './components/EvaluationDashboard'
import { exportFile, fetchTemplates, revalidateData, uploadFile, DOWNLOAD_TEMPLATE_URL } from './api'

export default function App() {
  const [mapping, setMapping] = useState({})
  const [summary, setSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [correctedText, setCorrectedText] = useState('')
  const [rawText, setRawText] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [batchResults, setBatchResults] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('rcv')
  const [templateNames, setTemplateNames] = useState([])
  const [currentTemplateLabel, setCurrentTemplateLabel] = useState('Plantilla RCV')
  const [loading, setLoading] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [auditQuery, setAuditQuery] = useState('')
  const [auditStatus, setAuditStatus] = useState('all')
  const [mappingStats, setMappingStats] = useState(null)
  const [structureValidation, setStructureValidation] = useState(null)
  const [strictMode, setStrictMode] = useState(false)
  const [minTemplateCoverage] = useState(95)

  const hasDataLoaded = Boolean(rawText)
  const canExport = Boolean(correctedText)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchTemplates()
        if (data.length > 0) {
          setTemplates(data)
          if (!data.find((item) => item.key === selectedTemplate)) {
            setSelectedTemplate(data[0].key)
          }
        }
      } catch (e) {
        setError(e.message || 'No fue posible cargar los modulos de plantillas')
      }
    }
    loadTemplates()
  }, [])

  const selectedTemplateMeta = useMemo(() => {
    return templates.find((item) => item.key === selectedTemplate) || null
  }, [templates, selectedTemplate])

  const filteredLogs = useMemo(() => {
    const query = auditQuery.trim().toLowerCase()
    return logs.filter((item) => {
      const statusOk = auditStatus === 'all' ? true : item.status === auditStatus
      if (!statusOk) return false
      if (!query) return true
      const line = `${item.row} ${item.column} ${item.original ?? ''} ${item.corrected ?? ''} ${item.status}`.toLowerCase()
      return line.includes(query)
    })
  }, [logs, auditQuery, auditStatus])

  const applyResponse = (data) => {
    const incomingTemplateKey = data.template_key || selectedTemplate
    setSelectedTemplate(incomingTemplateKey)
    setCurrentTemplateLabel(
      (templates.find((item) => item.key === incomingTemplateKey)?.label) ||
      (incomingTemplateKey === 'gestante' ? 'Plantilla Gestante' : 'Plantilla RCV')
    )
    setMapping(data.mapping_suggested || data.mapping || {})
    setSummary(data.summary || null)
    setLogs(data.logs_sample || [])
    setCorrectedText(data.corrected_text || '')
    setRawText(data.raw_text || rawText)
    setTemplateNames(data.template_names || [])
    setMappingStats(data.mapping_stats || null)
    setStructureValidation(data.structure_validation || null)
  }

  const selectBatchItem = (item) => {
    setSelectedFileName(item.fileName)
    setSelectedTemplate(item.templateKey || selectedTemplate)
    setMapping(item.mapping || {})
    setSummary(item.summary || null)
    setLogs(item.logs || [])
    setCorrectedText(item.correctedText || '')
    setRawText(item.rawText || '')
    setTemplateNames(item.templateNames || [])
  }

  const processSingleFile = async (file, reportProgress = true) => {
    const data = await uploadFile(file, selectedTemplate, reportProgress ? setProgress : undefined, {
      strictMode, minTemplateCoverage, requireExactColumns: true,
    })
    const item = {
      fileName: file.name, templateKey: selectedTemplate,
      mapping: data.mapping_suggested || data.mapping || {},
      summary: data.summary || null, logs: data.logs_sample || [],
      correctedText: data.corrected_text || '', rawText: data.raw_text || '',
      templateNames: data.template_names || [],
    }
    setBatchResults((prev) => {
      const filtered = prev.filter((entry) => entry.fileName !== item.fileName)
      return [...filtered, item]
    })
    setSelectedFileName(file.name)
    applyResponse(data)
  }

  const handleFile = async (input) => {
    if (!input) return
    const files = Array.isArray(input) ? input : [input]
    setLoading(true); setProgress(0); setError('')
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        setSelectedFileName(file.name)
        setProgress(Math.round((index / files.length) * 100))
        await processSingleFile(file, files.length === 1)
      }
    } catch (e) {
      setError(e.message || 'Error procesando archivo')
    } finally {
      setLoading(false); setProgress(100)
    }
  }

  const handleRevalidate = async () => {
    if (!rawText) return
    setReprocessing(true); setError('')
    try {
      const data = await revalidateData(rawText, mapping, selectedTemplate)
      applyResponse(data)
    } catch (e) {
      setError(e.message || 'Error reprocesando archivo')
    } finally {
      setReprocessing(false)
    }
  }

  const [evaluating, setEvaluating] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)

  const handleExport = async () => {
    try {
      const blob = await exportFile(correctedText)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Error exportando archivo')
    }
  }

  const handleEvaluate = () => {
    if (!correctedText || !correctedText.trim()) return
    setShowEvaluation(true)
  }

  const handleReset = () => {
    setMapping({}); setSummary(null); setLogs([]); setCorrectedText('')
    setRawText(''); setSelectedFileName(''); setBatchResults([])
    setTemplateNames([]); setLoading(false); setReprocessing(false)
    setProgress(0); setError(''); setAuditQuery(''); setAuditStatus('all')
    setMappingStats(null); setStructureValidation(null); setShowEvaluation(false)
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* ─── Header ─── */}
      <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 shadow-lg shadow-brand-900/20">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20 shadow-inner shadow-white/5">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 32 32" fill="none">
                    <path d="M16 2C14 8 9 11 5 14C1 17 0 22 3 26C6 30 12 31 17 28C21 26 24 22 24 18C24 14 21 11 18 8C17 6 17 4 16 2Z" fill="currentColor" opacity="0.35" />
                    <path d="M16 6C15 10 12 12 9 14C6 16 6 19 8 21C10 23 13 24 16 23C19 22 21 20 21 17C21 14 19 12 17 10C16 9 16 8 16 6Z" fill="currentColor" opacity="0.65" />
                    <path d="M16 12C15 14 13 15 12 16C11 17 11 18 12 19C13 20 14 20 16 19C17 18 18 17 18 16C18 15 17 14 16 12Z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-extrabold text-base tracking-wider">FÉNIX</span>
                    <span className="text-white/40 text-[0.55rem] font-medium uppercase tracking-[0.2em]">Indicadores</span>
                  </div>
                  <span className="text-white/40 text-[0.5rem] font-light leading-tight block">
                    Asociación de Cabildos Indígenas del Cesar y La Guajira
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedTemplateMeta && (
                <span className="hidden md:inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-white/70 text-[0.5rem] font-semibold tracking-wider uppercase ring-1 ring-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  {selectedTemplateMeta.fields} variables
                </span>
              )}
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 text-brand-500 accent-brand-500 focus:ring-0 cursor-pointer" />
                <span className="text-[0.5rem] font-semibold text-white/40 tracking-wider uppercase group-hover:text-white/60 transition-colors">Estricto</span>
              </label>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 md:px-8 py-8 md:py-10 space-y-6">

        {/* ─── Hero ─── */}
        <section className="card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/40 via-white to-white pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-800 via-brand-500 to-brand-400" />
          <div className="relative px-7 md:px-10 py-8 md:py-10">
            <div className="inline-flex items-center gap-1.5 bg-brand-50 rounded-full px-3 py-1 mb-4 ring-1 ring-brand-200/50">
              <div className="w-2 h-2 rounded-full bg-brand-800" />
              <span className="text-[0.55rem] font-bold text-brand-800 tracking-[0.15em] uppercase">Indicadores Fénix</span>
            </div>
            <h1 className="text-[clamp(1.6rem,4.5vw,2.8rem)] font-extrabold text-ink tracking-tight leading-none">
              Generador y validador<br />de plantillas PYM
            </h1>
            <p className="text-sm text-ink-muted mt-3 max-w-xl font-normal leading-relaxed">
              Carga tu archivo Excel o TXT, selecciona el módulo correspondiente y genera la plantilla estandarizada con validación automática.
            </p>
          </div>
        </section>

        {/* ─── Módulos ─── */}
        <section className="animate-fade-in-up">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="section-header">
              <div className="section-header-bar" />
              <h2 className="section-title">Módulos de plantilla</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-ink-line hidden md:block" />
              <span className="badge-gray">{templates.length} disponible{templates.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((item, idx) => {
              const isSelected = selectedTemplate === item.key
              const num = String(idx + 1).padStart(2, '0')
              const accent = [
                { bar: 'from-brand-800 via-brand-500 to-brand-400', dot: 'bg-brand-800', tag: 'bg-brand-100 text-brand-800' },
                { bar: 'from-rose-600 via-rose-400 to-rose-300', dot: 'bg-rose-600', tag: 'bg-rose-100 text-rose-700' },
                { bar: 'from-violet-600 via-violet-400 to-violet-300', dot: 'bg-violet-600', tag: 'bg-violet-100 text-violet-700' },
                { bar: 'from-amber-600 via-amber-400 to-amber-300', dot: 'bg-amber-600', tag: 'bg-amber-100 text-amber-700' },
                { bar: 'from-cyan-600 via-cyan-400 to-cyan-300', dot: 'bg-cyan-600', tag: 'bg-cyan-100 text-cyan-700' },
              ][idx] || { bar: 'from-brand-800 via-brand-500 to-brand-400', dot: 'bg-brand-800', tag: 'bg-brand-100 text-brand-800' }
              const short = { rcv: 'RCV', gestante: 'GEST', citologia: 'CITO', mamografia: 'MAMO', penta: 'PENTA' }[item.key] || item.key.toUpperCase()
              return (
                <div key={item.key} className={`relative transition-all duration-200 overflow-hidden ${
                  isSelected ? 'card-active' : 'card-hover border-ink-line/60'
                }`}>
                  <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${accent.bar} opacity-60`} />
                  <button onClick={() => {
                    setSelectedTemplate(item.key); setCurrentTemplateLabel(item.label)
                    setTemplateNames([]); setMapping({}); setSummary(null); setLogs([]); setCorrectedText('')
                  }} className="w-full text-left p-5">
                    {isSelected && (
                      <div className={`absolute top-3 right-3 w-6 h-6 rounded-full ${accent.dot} flex items-center justify-center shadow-sm`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all text-sm font-bold ${
                        isSelected ? `${accent.dot} text-white shadow-sm` : 'bg-brand-50 text-brand-800'
                      }`}>
                        {num}
                      </div>
                      <div>
                        <span className="text-[0.5rem] font-bold text-brand-700 tracking-[0.15em] uppercase block leading-none mb-0.5">Plantilla</span>
                        <span className="text-sm font-bold text-ink">{item.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">{item.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="badge-green">{item.fields} variables</span>
                      <span className={`text-[0.5rem] font-bold tracking-wider rounded-md px-2 py-0.5 ${accent.tag}`}>{short}</span>
                    </div>
                  </button>
                  <div className="px-5 pb-4 pt-0 border-t border-ink-line/30">
                    <a href={DOWNLOAD_TEMPLATE_URL(item.key)}
                      className="inline-flex items-center gap-1.5 text-[0.55rem] font-semibold text-brand-800 hover:text-brand-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar plantilla Excel
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── Drop zone ─── */}
        <div className="card p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <DragDrop onFile={handleFile} />
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="animate-slide-down rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-sm text-red-600 flex items-start gap-3 shadow-sm">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ─── Loading ─── */}
        {loading && (
          <div className="card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-800 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div>
                  <span className="text-sm font-bold text-ink">Procesando archivo</span>
                  {selectedFileName && <span className="text-xs text-ink-muted block leading-tight">{selectedFileName}</span>}
                </div>
              </div>
              <span className="text-lg font-bold text-brand-800">{progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-800 to-brand-500 transition-all duration-500 ease-out shadow-sm shadow-brand-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ─── Stats + Actions ─── */}
        {summary && !showEvaluation && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="grid gap-4 md:grid-cols-4">
              <StatsCard label="Registros" value={summary.total} color="neutral" />
              <StatsCard label="Errores" value={summary.errors} color="red" />
              <StatsCard label="Corregidos" value={summary.corrected} color="gold" />
              <StatsCard label="Calidad" value={`${summary.quality_percent}%`} color="green" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleRevalidate} disabled={!hasDataLoaded || reprocessing} className="btn-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {reprocessing ? 'Validando...' : 'Validar y ajustar'}
              </button>
              <button onClick={handleExport} disabled={!canExport} className="btn-outline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar archivo final
              </button>
              {selectedTemplate === 'rcv' && (
                <button onClick={handleEvaluate} disabled={!canExport || evaluating} className="btn-accent">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {evaluating ? 'Evaluando...' : 'Evaluación de indicadores'}
                </button>
              )}
              <button onClick={handleReset} className="btn-secondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* ─── Estructura y mapeo ─── */}
        {(mappingStats || structureValidation) && !showEvaluation && (
          <section className="card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="section-header">
                <div className="section-header-bar" />
                <h2 className="section-title">Estructura y mapeo</h2>
              </div>
              {mappingStats && (
                <span className={`badge ${
                  mappingStats.coverage_percent >= 80 ? 'badge-green' : 'badge-red'
                }`}>
                  {mappingStats.coverage_percent}% cobertura
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {structureValidation && (
                <div className="rounded-lg border border-ink-line/60 bg-surface-50/70 p-4 text-xs text-ink space-y-1.5">
                  {[
                    ['Columnas en archivo', structureValidation.input_columns],
                    ['Columnas plantilla', structureValidation.template_columns],
                    ['Diferencia', structureValidation.column_diff],
                    ['Filas procesadas', structureValidation.row_count],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-ink-muted">{label}</span>
                      <span className="font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              )}
              {mappingStats && (
                <div className="rounded-lg border border-ink-line/60 bg-surface-50/70 p-4 text-xs text-ink space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Encabezados mapeados</span>
                    <span className="font-semibold">{mappingStats.mapped_headers} / {mappingStats.total_headers}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-ink-faint text-[0.5rem] font-medium uppercase tracking-wider">No mapeados:</span>
                    <div className="mt-0.5 max-h-12 overflow-auto text-[0.6rem] text-ink-muted scroll-thin">
                      {(mappingStats.unmapped_headers || []).length === 0 ? (
                        <span className="text-brand-700 font-medium">Ninguno</span>
                      ) : (mappingStats.unmapped_headers || []).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Archivos procesados ─── */}
        {batchResults.length > 0 && !showEvaluation && (
          <div className="card p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="section-header">
                <div className="section-header-bar" />
                <h2 className="section-title">Archivos procesados</h2>
              </div>
              <span className="badge-gray">{batchResults.length} archivo(s)</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {batchResults.map((item) => (
                <button key={item.fileName} onClick={() => selectBatchItem(item)}
                  className={`relative text-left transition-all duration-200 ${
                    selectedFileName === item.fileName
                      ? 'card-active p-4'
                      : 'card-hover border-ink-line/60 p-4'
                  }`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedFileName === item.fileName ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-800'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-ink truncate">{item.fileName}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-10">
                    <span className="text-[0.55rem] text-ink-muted font-medium">
                      <span className="text-ink font-semibold">{item.summary?.total ?? 0}</span> registros
                    </span>
                    <span className="w-1 h-1 rounded-full bg-ink-line" />
                    <span className="text-[0.55rem] text-ink-muted font-medium">
                      <span className={item.summary?.errors > 0 ? 'text-red-500 font-semibold' : 'text-ink font-semibold'}>{item.summary?.errors ?? 0}</span> errores
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Mapeo de columnas ─── */}
        {Object.keys(mapping).length > 0 && !showEvaluation && (
          <div className="card p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand-800 flex items-center justify-center shrink-0 shadow-sm shadow-brand-900/20">
                <span className="text-white text-[0.5rem] font-bold">03</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">Mapeo de columnas</h2>
                <p className="text-xs text-ink-muted">Ajusta las columnas y presiona "Validar y ajustar".</p>
              </div>
            </div>
            <MappingEditor mapping={mapping} templateNames={templateNames}
              onChange={(orig, value) => setMapping((prev) => ({ ...prev, [orig]: value || null }))} />
          </div>
        )}

        {/* ─── Dashboard de evaluación ─── */}
        {showEvaluation && (
          <EvaluationDashboard
            correctedText={correctedText}
            templateNames={templateNames}
            selectedTemplate={selectedTemplate}
            onClose={() => setShowEvaluation(false)}
          />
        )}

        {/* ─── Vista previa + Auditoría ─── */}
        {correctedText && !showEvaluation && (
          <div className="space-y-5">
            <div className="card p-5 space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-800 flex items-center justify-center shrink-0 shadow-sm shadow-brand-900/20">
                  <span className="text-white text-[0.5rem] font-bold">04</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">Vista previa validada</h2>
                  {selectedFileName && <p className="text-xs text-ink-muted">Archivo activo: {selectedFileName}</p>}
                </div>
              </div>
              <DataGridTable corrected_text={correctedText} templateColumns={templateNames} logs={logs} />
            </div>

            <div className="card p-5 space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-800 flex items-center justify-center shrink-0 shadow-sm shadow-brand-900/20">
                    <span className="text-white text-[0.5rem] font-bold">05</span>
                  </div>
                  <h2 className="text-sm font-bold text-ink">Auditoría de cambios</h2>
                </div>
                <span className="badge-gray">{logs.length} novedad{logs.length !== 1 ? 'es' : ''}</span>
              </div>

              {logs.length === 0 && (
                <div className="rounded-lg border border-brand-200/60 bg-brand-50/50 p-4 text-sm text-ink flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">No se detectaron cambios ni errores para este archivo.</span>
                </div>
              )}

              {logs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 rounded-xl border border-ink-line/60 bg-surface-50/70 p-3 md:flex-row md:items-center">
                    <div className="relative flex-1 md:max-w-xs">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input value={auditQuery} onChange={(e) => setAuditQuery(e.target.value)}
                        placeholder="Buscar por fila, variable o valor"
                        className="input pl-9" />
                    </div>
                    <select value={auditStatus} onChange={(e) => setAuditStatus(e.target.value)}
                      className="select md:w-44">
                      <option value="all">Todos los estados</option>
                      <option value="corrected">Corregidos</option>
                      <option value="error">Errores</option>
                    </select>
                  </div>
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-ink-line/60 bg-white scroll-thin">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-surface-50 border-b border-ink-line">
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Fila</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Variable</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Original</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Corregido</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log, index) => (
                          <tr key={`${log.row}-${log.column}-${index}`} className="border-b border-surface-100 align-top hover:bg-brand-50/20 transition-colors">
                            <td className="px-4 py-2.5 text-xs font-semibold text-ink-muted">{log.row}</td>
                            <td className="px-4 py-2.5 text-xs font-semibold text-ink">{log.column}</td>
                            <td className="px-4 py-2.5 text-xs text-ink-muted break-words max-w-[200px] font-mono">{String(log.original ?? '—') || '—'}</td>
                            <td className="px-4 py-2.5 text-xs text-ink break-words max-w-[200px] font-mono">{String(log.corrected ?? '—') || '—'}</td>
                            <td className="px-4 py-2.5 text-xs">
                              <span className={`inline-flex items-center gap-1.5 text-[0.45rem] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${
                                log.status === 'error'
                                  ? 'bg-red-50 text-red-600 border border-red-200/50'
                                  : 'bg-brand-50 text-brand-800 border border-brand-200/50'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'error' ? 'bg-red-500' : 'bg-brand-800'}`} />
                                {log.status === 'error' ? 'Error' : 'Corregido'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
