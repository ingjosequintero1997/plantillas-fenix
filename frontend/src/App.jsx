import React, { useMemo, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'
import DragDrop from './components/DragDrop'
import MappingEditor from './components/MappingEditor'
import DataGridTable from './components/DataGridTable'
import StatsCard from './components/StatsCard'
import EvaluationDashboard from './components/EvaluationDashboard'
import AuditoriaExport from './components/AuditoriaExport'
import Pagination from './components/Pagination'
import { exportFile, fetchTemplates, revalidateData, uploadFile, DOWNLOAD_TEMPLATE_URL } from './api'

const AUDIT_PER_PAGE = 50

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

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
  const [auditPage, setAuditPage] = useState(1)
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
        setError(e.message || 'Error al cargar plantillas')
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

  const paginatedLogs = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PER_PAGE
    return filteredLogs.slice(start, start + AUDIT_PER_PAGE)
  }, [filteredLogs, auditPage])

  const auditTotalPages = Math.ceil(filteredLogs.length / AUDIT_PER_PAGE)

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
      setError(e.message || 'Error al procesar archivo')
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
      setError(e.message || 'Error al revalidar')
    } finally {
      setReprocessing(false)
    }
  }

  const [evaluating, setEvaluating] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [showAuditoria, setShowAuditoria] = useState(false)

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
      setError(e.message || 'Error al exportar')
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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-[#F5F3EF] dark:bg-[#0D0D0F]">

      {/* ─── Header ─── */}
      <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 shadow-lg shadow-brand-900/15">
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
                    <span className="text-white/60 text-[0.65rem] font-medium uppercase tracking-[0.2em]">Validación de plantillas</span>
                  </div>
                  <span className="text-white/50 text-[0.6rem] font-light leading-tight block">
                    Asociación de Cabildos Indígenas del Cesar y La Guajira
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDarkMode(!darkMode)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center ring-1 ring-white/10 transition-all" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                {darkMode ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {selectedTemplateMeta && (
                <span className="hidden md:inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-white/70 text-[0.5rem] font-semibold tracking-wider uppercase ring-1 ring-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  {selectedTemplateMeta.fields} variables
                </span>
              )}
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 text-brand-500 accent-brand-500 focus:ring-0 cursor-pointer transition-all" />
                <span className="text-[0.5rem] font-semibold text-white/40 tracking-wider uppercase group-hover:text-white/60 transition-colors">Estricto</span>
              </label>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 md:px-8 py-8 md:py-12 space-y-8">

        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50/60 via-white to-white dark:from-brand-950/50 dark:via-[#333337] dark:to-[#333337] shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-800 via-brand-500 to-brand-300 rounded-r-sm" />
          <div className="relative px-8 md:px-12 py-10 md:py-12">
            <div className="inline-flex items-center gap-1.5 bg-brand-100/70 dark:bg-brand-900/40 rounded-full px-3 py-1 mb-4 ring-1 ring-brand-200/50 dark:ring-brand-700/40">
              <div className="w-2 h-2 rounded-full bg-brand-700" />
              <span className="text-[0.55rem] font-bold text-brand-800 dark:text-brand-200 tracking-[0.15em] uppercase">Bienvenido</span>
            </div>
            <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-extrabold text-ink tracking-tight leading-[1.1]">
              Valida tus plantillas<br />de indicadores
            </h1>
            <p className="text-sm text-ink-muted/90 mt-3 max-w-xl font-normal leading-relaxed">
              Carga tu archivo, selecciona la plantilla y obtén los datos listos al instante.
            </p>
          </div>
        </section>

        {/* ─── Módulos ─── */}
        <section className="animate-fade-in-up">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="section-header">
              <div className="section-header-bar" />
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">Plantillas</h2>
                <p className="text-xs text-ink-muted/70 mt-0.5">Selecciona la plantilla según los datos a procesar</p>
              </div>
            </div>
            <span className="badge-gray shrink-0">{templates.length} disponible{templates.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((item, idx) => {
              const isSelected = selectedTemplate === item.key
              const num = String(idx + 1).padStart(2, '0')
              const accent = [
                { dot: 'bg-brand-700', tag: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200', border: 'border-brand-300/40 dark:border-brand-700/40', light: 'bg-brand-50 dark:bg-brand-900/30' },
                { dot: 'bg-rose-600', tag: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', border: 'border-rose-300/40 dark:border-rose-700/40', light: 'bg-rose-50 dark:bg-rose-900/30' },
                { dot: 'bg-amber-600', tag: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', border: 'border-amber-300/40 dark:border-amber-700/40', light: 'bg-amber-50 dark:bg-amber-900/30' },
                { dot: 'bg-sky-600', tag: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', border: 'border-sky-300/40 dark:border-sky-700/40', light: 'bg-sky-50 dark:bg-sky-900/30' },
                { dot: 'bg-violet-600', tag: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', border: 'border-violet-300/40 dark:border-violet-700/40', light: 'bg-violet-50 dark:bg-violet-900/30' },
              ][idx] || { dot: 'bg-brand-700', tag: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200', border: 'border-brand-300/40 dark:border-brand-700/40', light: 'bg-brand-50 dark:bg-brand-900/30' }
              const short = { rcv: 'RCV', gestante: 'GEST', citologia: 'CITO', mamografia: 'MAMO', penta: 'PENTA' }[item.key] || item.key.toUpperCase()
              return (
                <div key={item.key} className={`relative transition-all duration-200 rounded-2xl bg-white dark:bg-[#333337] border ${
                  isSelected
                    ? 'ring-2 ring-brand-800/15 dark:ring-brand-500/20 shadow-md dark:shadow-black/40 border-brand-800/30 dark:border-brand-500/30'
                    : 'border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 hover:shadow-md dark:hover:shadow-black/50 hover:-translate-y-0.5 hover:border-ink-line/70 dark:hover:border-[#666669]'
                }`}>
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
                        isSelected ? `${accent.dot} text-white shadow-sm` : `${accent.light} text-brand-800 dark:text-brand-200`
                      }`}>
                        {num}
                      </div>
                      <div>
                        <span className="text-[0.5rem] font-bold text-ink-muted tracking-[0.15em] uppercase block leading-none mb-0.5">Plantilla</span>
                        <span className="text-sm font-bold text-ink">{item.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted/80 leading-relaxed mb-4">{item.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="badge-green">{item.fields} variables</span>
                      <span className={`text-[0.5rem] font-bold tracking-wider rounded-md px-2 py-0.5 ${accent.tag}`}>{short}</span>
                    </div>
                  </button>
                  <div className="px-5 pb-4 pt-0 border-t border-ink-line/30">
                    <a href={DOWNLOAD_TEMPLATE_URL(item.key)}
                      className="inline-flex items-center gap-1.5 text-[0.55rem] font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar plantilla
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ─── Módulo Auditoría ─── */}
          <div className={`relative transition-all duration-200 rounded-2xl bg-white dark:bg-[#333337] border mt-5 ${
            showAuditoria
              ? 'ring-2 ring-amber-500/15 dark:ring-amber-500/20 shadow-md dark:shadow-black/40 border-amber-400/30'
              : 'border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 hover:shadow-md dark:hover:shadow-black/50 hover:-translate-y-0.5 hover:border-ink-line/70 dark:hover:border-[#666669]'
          }`}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/60 via-amber-400/60 to-amber-300/60 rounded-t-2xl" />
            <button onClick={() => setShowAuditoria(!showAuditoria)}
              className="w-full text-left p-5">
              {showAuditoria && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all text-sm font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[0.5rem] font-bold text-amber-700 dark:text-amber-300 tracking-[0.15em] uppercase block leading-none mb-0.5">Módulo</span>
                  <span className="text-sm font-bold text-ink">Auditoría Excel</span>
                </div>
              </div>
              <p className="text-xs text-ink-muted/80 leading-relaxed mb-4">
                Convierte archivos TXT en un libro Excel ordenado por variables.
              </p>
              <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/40">
                  TXT → Excel
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* ─── Auditoría Export ─── */}
        {showAuditoria && (
          <AuditoriaExport onClose={() => setShowAuditoria(false)} />
        )}

        {/* ─── Contenido principal ─── */}
        {!showAuditoria && (<>
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <DragDrop onFile={handleFile} />
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="animate-slide-down rounded-2xl border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3 shadow-sm">
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
          <div className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-800 dark:text-brand-300 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div>
                  <span className="text-sm font-bold text-ink">Procesando…</span>
                  {selectedFileName && <span className="text-xs text-ink-muted block leading-tight">{selectedFileName}</span>}
                </div>
              </div>
              <span className="text-lg font-bold text-brand-800">{progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-line/40">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-800 to-brand-500 transition-all duration-500 ease-out shadow-sm shadow-brand-200 dark:shadow-brand-700/50" style={{ width: `${progress}%` }} />
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
                {reprocessing ? 'Validando...' : 'Validar'}
              </button>
              <button onClick={handleExport} disabled={!canExport} className="btn-outline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar TXT
              </button>
              {selectedTemplate === 'rcv' && (
                <button onClick={handleEvaluate} disabled={!canExport || evaluating} className="btn bg-brand-700 dark:bg-brand-600 text-white hover:bg-brand-800 dark:hover:bg-brand-500 shadow-sm dark:shadow-black/30 hover:shadow-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {evaluating ? 'Evaluando...' : 'Indicadores'}
                </button>
              )}
              <button onClick={handleReset} className="btn-secondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reiniciar
              </button>
            </div>
          </div>
        )}

        {/* ─── Estructura y mapeo ─── */}
        {(mappingStats || structureValidation) && !showEvaluation && (
          <section className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 animate-fade-in-up">
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
                <div className="rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-[#F8F7F4] dark:bg-[#28282B] p-4 text-xs text-ink space-y-1.5">
                  {[
                    ['Columnas archivo', structureValidation.input_columns],
                    ['Columnas plantilla', structureValidation.template_columns],
                    ['Diferencia', structureValidation.column_diff],
                    ['Registros procesados', structureValidation.row_count],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-ink-muted">{label}</span>
                      <span className="font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              )}
              {mappingStats && (
                <div className="rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-[#F8F7F4] dark:bg-[#28282B] p-4 text-xs text-ink space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Encabezados mapeados</span>
                    <span className="font-semibold">{mappingStats.mapped_headers} / {mappingStats.total_headers}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-ink-faint text-[0.5rem] font-medium uppercase tracking-wider">Sin mapear</span>
                    <div className="mt-0.5 max-h-12 overflow-auto text-[0.6rem] text-ink-muted scroll-thin">
                      {(mappingStats.unmapped_headers || []).length === 0 ? (
                        <span className="text-brand-700 dark:text-brand-300 font-medium">—</span>
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
          <div className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="section-header">
                <div className="section-header-bar" />
                <h2 className="section-title">Archivos procesados</h2>
              </div>
              <span className="badge-gray">{batchResults.length} archivo{batchResults.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {batchResults.map((item) => (
                <button key={item.fileName} onClick={() => selectBatchItem(item)}
                  className={`relative text-left transition-all duration-200 rounded-2xl ${
                    selectedFileName === item.fileName
                      ? 'ring-2 ring-brand-800/15 shadow-md border border-brand-800/30 p-4 bg-white dark:bg-[#3D3D40] dark:ring-brand-500/20 dark:shadow-black/40 dark:border-brand-500/30'
                      : 'border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 hover:shadow-md dark:hover:shadow-black/50 hover:-translate-y-0.5 hover:border-ink-line/70 dark:hover:border-[#666669] p-4 bg-white dark:bg-[#333337]'
                  }`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedFileName === item.fileName ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200'
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
          <div className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-800 dark:bg-brand-600 flex items-center justify-center shrink-0 shadow-sm shadow-brand-900/20">
                <span className="text-white text-[0.5rem] font-bold">03</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">Mapeo de columnas</h2>
                <p className="text-xs text-ink-muted/80">Asigna las columnas del archivo a las de la plantilla.</p>
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
        {correctedText && !showEvaluation && !showAuditoria && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-800 dark:bg-brand-600 flex items-center justify-center shrink-0 shadow-sm shadow-brand-900/20">
                  <span className="text-white text-[0.5rem] font-bold">04</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">Vista previa</h2>
                  {selectedFileName && <p className="text-xs text-ink-muted/80">Archivo activo: {selectedFileName}</p>}
                </div>
              </div>
              <DataGridTable corrected_text={correctedText} templateColumns={templateNames} logs={logs} />
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-800 dark:bg-brand-600 flex items-center justify-center shrink-0 shadow-sm shadow-brand-900/20">
                    <span className="text-white text-[0.5rem] font-bold">05</span>
                  </div>
                    <h2 className="text-sm font-bold text-ink">Bitácora de cambios</h2>
                </div>
                <span className="badge-gray">{logs.length} cambio{logs.length !== 1 ? 's' : ''}</span>
              </div>

              {logs.length === 0 && (
                <div className="rounded-xl border border-brand-200/60 dark:border-brand-700/40 bg-brand-50/60 dark:bg-brand-900/30 p-4 text-sm text-ink flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-100/80 dark:bg-brand-800/50 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">Todo correcto. Sin cambios ni errores.</span>
                </div>
              )}

              {logs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-[#F8F7F4] dark:bg-[#28282B] p-3 md:flex-row md:items-center">
                    <div className="relative flex-1 md:max-w-xs">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input value={auditQuery} onChange={(e) => { setAuditQuery(e.target.value); setAuditPage(1) }}
                        placeholder="Buscar…"
                        className="input pl-9" />
                    </div>
                    <select value={auditStatus} onChange={(e) => { setAuditStatus(e.target.value); setAuditPage(1) }}
                      className="select md:w-44">
                      <option value="all">Todos</option>
                      <option value="corrected">Corregidos</option>
                      <option value="error">Errores</option>
                    </select>
                  </div>
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-ink-line/50 dark:border-[#666669]/50 bg-white dark:bg-[#333337] scroll-thin shadow-sm dark:shadow-black/30">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-[#F8F7F4] dark:bg-[#28282B] border-b border-ink-line/50 dark:border-[#666669]/50">
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Fila</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Variable</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Original</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Corregido</th>
                          <th className="px-4 py-3 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLogs.map((log, index) => (
                          <tr key={`${log.row}-${log.column}-${index}`} className="border-b border-surface-100 dark:border-[#666669]/50 align-top hover:bg-brand-50/20 dark:hover:bg-brand-900/20 transition-colors">
                            <td className="px-4 py-2.5 text-xs font-semibold text-ink-muted">{log.row}</td>
                            <td className="px-4 py-2.5 text-xs font-semibold text-ink">{log.column}</td>
                            <td className="px-4 py-2.5 text-xs text-ink-muted break-words max-w-[200px] font-mono">{String(log.original ?? '—') || '—'}</td>
                            <td className="px-4 py-2.5 text-xs text-ink break-words max-w-[200px] font-mono">{String(log.corrected ?? '—') || '—'}</td>
                            <td className="px-4 py-2.5 text-xs">
                              <span className={`inline-flex items-center gap-1.5 text-[0.45rem] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${
                                log.status === 'error'
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-700/40'
                                  : 'bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 border border-brand-200/50 dark:border-brand-700/40'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'error' ? 'bg-red-500' : 'bg-brand-800 dark:bg-brand-400'}`} />
                                {log.status === 'error' ? 'Error' : 'Corregido'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={auditPage} totalPages={auditTotalPages} onChange={setAuditPage} />
                </div>
              )}
            </div>
          </div>
        )}
        </>)}
      </div>

      {/* Footer */}
      <div className="border-t border-ink-line/40 dark:border-[#666669]/40 py-4 px-5 text-center">
        <p className="text-[0.5rem] text-ink-faint uppercase tracking-wider font-medium">
          Desarrollado por el Ing. José Quintero &mdash; Todos los derechos reservados &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
