import React, { useMemo, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardHome from './components/DashboardHome'
import PlantillasView from './components/PlantillasView'
import HistorialView from './components/HistorialView'
import PrestadoresView from './components/PrestadoresView'
import FormulasView from './components/FormulasView'
import AjustesView from './components/AjustesView'
import ConsolidacionView from './components/ConsolidacionView'
import HistoriasView from './components/HistoriasView'
import DragDrop from './components/DragDrop'
import MappingEditor from './components/MappingEditor'
import DataGridTable from './components/DataGridTable'
import StatsCard from './components/StatsCard'
import EvaluationDashboard from './components/EvaluationDashboard'
import Pagination from './components/Pagination'
import { fetchTemplates, revalidateData, uploadFile, exportExcelFile, saveCargue } from './api'
import * as pako from 'pako'

const AUDIT_PER_PAGE = 50

function b64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Las respuestas grandes vienen comprimidas con gzip desde el backend.
function maybeDecompress(data) {
  if (!data || !data.compressed) return data
  const decode = (s) => {
    if (typeof s !== 'string' || !s) return s
    try {
      const out = pako.ungzip(b64ToBytes(s), { to: 'string' })
      if (typeof out === 'string') return out
      return new TextDecoder('utf-8').decode(out)
    } catch (e) {
      console.warn('No se pudo descomprimir la respuesta:', e)
      return ''
    }
  }
  return {
    ...data,
    corrected_text: decode(data.corrected_text),
    raw_text: decode(data.raw_text),
  }
}

export default function App() {
  const { user } = useAuth()

  const [section, setSection] = useState('inicio')
  const [mapping, setMapping] = useState({})
  const [summary, setSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [correctedText, setCorrectedText] = useState('')
  const [rawText, setRawText] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [batchResults, setBatchResults] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('gestante')
  const [templateNames, setTemplateNames] = useState([])
  const [currentTemplateLabel, setCurrentTemplateLabel] = useState('Plantilla Gestante')
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
  const [evaluating, setEvaluating] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)

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
      (incomingTemplateKey === 'gestante' ? 'Plantilla Gestante' : 'Plantilla ' + incomingTemplateKey)
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
    const raw = await uploadFile(file, 'auto', reportProgress ? setProgress : undefined, {
      strictMode, minTemplateCoverage, requireExactColumns: true,
    })
    const data = maybeDecompress(raw)
    const item = {
      fileName: file.name, templateKey: selectedTemplate,
      mapping: data.mapping_suggested || data.mapping || {},
      summary: data.summary || null, logs: data.logs_sample || [],
      correctedText: data.corrected_text || '', rawText: data.raw_text || '',
      templateNames: data.template_names || [],
    }
    // Guardar en el historial de cargues (envía el corrected_text comprimido
    // para no exceder el límite de body en el entorno desplegado).
    try {
      const summary = data.summary || {}
      await saveCargue({
        corrected_text: raw.corrected_text || '',
        raw_text: raw.raw_text || '',
        compressed: true,
        template_key: data.template_key || selectedTemplate,
        filename: file.name,
        summary,
        logs: data.logs_sample || [],
        row_count: summary.total || 0,
        errors_count: summary.errors || 0,
        corrected_count: summary.corrected || 0,
        quality_percent: summary.quality_percent || 0,
      })
    } catch (e) {
      console.warn('No se pudo guardar el cargue en el historial:', e)
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
      const data = maybeDecompress(await revalidateData(rawText, mapping, selectedTemplate))
      applyResponse(data)
    } catch (e) {
      setError(e.message || 'Error al revalidar')
    } finally {
      setReprocessing(false)
    }
  }

  const handleExport = async () => {
    try {
      const filename = `export_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.txt`
      const blob = new Blob([correctedText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
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

  const handleSelectTemplate = (key) => {
    setSelectedTemplate(key)
    setCurrentTemplateLabel(templates.find((item) => item.key === key)?.label || key)
    setTemplateNames([]); setMapping({}); setSummary(null); setLogs([]); setCorrectedText('')
  }

  const handleExportExcel = async () => {
    if (!correctedText || !correctedText.trim()) return
    try {
      const filename = `data_corregida_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.xlsx`
      const blob = await exportExcelFile(correctedText, selectedTemplate, filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Error al exportar Excel')
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <ErrorBoundary>
          <DashboardLayout section={section} onNavigate={setSection}>

            {/* ─── INICIO ─── */}
            {section === 'inicio' && (
              <div className="space-y-6">
                <DashboardHome
                  user={user}
                  summary={summary}
                  batchResults={batchResults}
                />

                <PlantillasView
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onSelect={handleSelectTemplate}
                  onNavigate={setSection}
                />
              </div>
            )}

            {/* ─── SUBIR DATA / VALIDAR ─── */}
            {section === 'subir' && (
              <div className="space-y-6">
                <DragDrop onFile={handleFile} />

                {error && (
                  <div className="animate-slide-down rounded-2xl border border-red-200/80 dark:border-red-800/50 bg-gradient-to-r from-red-50/90 to-red-50/60 dark:from-red-950/40 dark:to-red-950/20 backdrop-blur px-5 py-4 flex items-start gap-3 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                  </div>
                )}

                {loading && (
                  <div className="rounded-2xl bg-white/80 dark:bg-[#333337]/80 backdrop-blur-lg border border-ink-line/50 dark:border-[#666669]/50 shadow-lg dark:shadow-black/40 p-5 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-900/20">
                          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-ink">Procesando archivo…</span>
                          {selectedFileName && <span className="text-xs text-ink-muted/70 block leading-tight mt-0.5">{selectedFileName}</span>}
                        </div>
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-line/30 dark:bg-[#555558]/30">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500 transition-all duration-500 ease-out shadow-sm shadow-brand-500/30" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {summary && (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* Resumen */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="section-header">
                        <div className="section-header-bar" />
                        <h2 className="section-title">Resumen de la validación</h2>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentTemplateLabel && (
                          <span className="badge-green">Data detectada: {currentTemplateLabel}</span>
                        )}
                        {selectedFileName && <span className="badge-gray">{selectedFileName}</span>}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <StatsCard label="Registros" value={summary.total} color="neutral" />
                      <StatsCard label="Errores" value={summary.errors} color="red" />
                      <StatsCard label="Corregidos" value={summary.corrected} color="gold" />
                      <StatsCard label="Calidad" value={`${summary.quality_percent}%`} color="green" />
                    </div>

                    {/* Botón principal: descargar data ajustada */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 shadow-xl shadow-brand-900/20 p-6 md:p-8 text-center">
                      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                      <div className="relative">
                        <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 mb-4 ring-1 ring-white/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[0.5rem] font-bold text-white/90 tracking-[0.15em] uppercase">Data lista</span>
                        </div>
                        <h3 className="text-white text-xl md:text-2xl font-extrabold tracking-tight mb-2">Tu data quedó ajustada</h3>
                        <p className="text-white/75 text-sm max-w-lg mx-auto mb-6 font-normal">
                          Descarga el archivo Excel con los datos corregidos y las fórmulas de cálculo aplicadas, listo para abrir y usar.
                        </p>
                        <button onClick={handleExportExcel} disabled={!canExport}
                          className="inline-flex items-center gap-3 rounded-2xl bg-white text-brand-800 hover:bg-brand-50 px-8 py-4 text-base font-extrabold shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          DESCARGAR DATA AJUSTADA
                        </button>
                      </div>
                    </div>

                    {/* Fórmulas aplicadas */}
                    <FormulasView />

                    {/* Ajustes realizados */}
                    <AjustesView logs={logs} />
                  </div>
                )}
              </div>
            )}
            {/* ─── HISTORIAL / VERIFICAR DATA ─── */}
            {section === 'historial' && (
              <HistorialView onNavigate={setSection} />
            )}

            {/* ─── CONSOLIDAR ─── */}
            {section === 'consolidar' && (
              <ConsolidacionView templates={templates} />
            )}

            {/* ─── HISTORIAS CLÍNICAS ─── */}
            {section === 'historias' && (
              <HistoriasView />
            )}

            {/* ─── PRESTADORES (admin) ─── */}
            {section === 'prestadores' && (
              <PrestadoresView />
            )}

          </DashboardLayout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
