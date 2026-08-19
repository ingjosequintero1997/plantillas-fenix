import React, { useMemo, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardHome from './components/DashboardHome'
import TemplateSelector from './components/TemplateSelector'
import HistorialView from './components/HistorialView'
import PrestadoresView from './components/PrestadoresView'
import FormulasView from './components/FormulasView'
import AjustesView from './components/AjustesView'
import ConsolidacionView from './components/ConsolidacionView'
import HistoriasView from './components/HistoriasView'
import DragDrop from './components/DragDrop'
import MappingEditor from './components/MappingEditor'
import DataGridTable from './components/DataGridTable'
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
  const [activeTemplate, setActiveTemplate] = useState('')
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
          // Si el usuario (prestador) tiene una sola plantilla, se activa
          // automáticamente. El admin ve el selector de todas.
          if (user?.role !== 'admin' && data.length === 1) {
            setActiveTemplate(data[0].key)
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
      // Mostrar el resultado de la validación
      setSection('subir')
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
    setActiveTemplate(key)
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
          <DashboardLayout
            section={section}
            onNavigate={setSection}
            templates={templates}
            activeTemplate={activeTemplate}
            onSelectTemplate={handleSelectTemplate}
          >

            {/* ─── INICIO ─── */}
            {section === 'inicio' && (
              !activeTemplate ? (
                <TemplateSelector
                  templates={templates}
                  onSelect={handleSelectTemplate}
                />
              ) : (
                <div className="space-y-6 fade-in">
                  {/* Acceso discreto para cambiar plantilla */}
                  <div className="flex items-center justify-between">
                    <div className="section-label">
                      Plantilla activa: {templates.find((t) => t.key === activeTemplate)?.label}
                    </div>
                    {templates.length > 1 && (
                      <button onClick={() => setActiveTemplate('')} className="btn-ghost text-xs">
                        Cambiar plantilla
                      </button>
                    )}
                  </div>

                  <DashboardHome
                    user={user}
                    summary={summary}
                    batchResults={batchResults}
                    templates={templates}
                    activeTemplate={activeTemplate}
                  />
                </div>
              )
            )}

            {/* ─── SUBIR DATA / VALIDAR ─── */}
            {section === 'subir' && (
              <div className="space-y-6 fade-in">
                {!summary ? (
                  <>
                    <div>
                      <div className="page-title">Cargue mensual</div>
                      <div className="page-subtitle">Sube tu data del período para validarla contra el instructivo.</div>
                    </div>
                    <DragDrop onFile={handleFile} />
                    {error && (
                      <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Cabecera con resumen */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="page-title">Resumen de la validación</div>
                        <div className="page-subtitle">{selectedFileName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentTemplateLabel && <span className="badge-neutral">Data detectada: {currentTemplateLabel}</span>}
                      </div>
                    </div>

                    {/* Resumen en línea (no tarjetas llenas) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-5 border-y" style={{ borderColor: 'var(--border)' }}>
                      <div><div className="stat-label">Registros</div><div className="stat-value">{summary.total}</div></div>
                      <div><div className="stat-label">Errores</div><div className="stat-value" style={{ color: summary.errors ? 'var(--error)' : 'var(--success)' }}>{summary.errors}</div></div>
                      <div><div className="stat-label">Corregidos</div><div className="stat-value">{summary.corrected}</div></div>
                      <div><div className="stat-label">Calidad</div><div className="stat-value">{summary.quality_percent}%</div></div>
                    </div>

                    {/* Descarga de data ajustada */}
                    <div className="panel flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>Tu data quedó ajustada</div>
                        <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Descarga el archivo con los datos corregidos y las fórmulas aplicadas.</div>
                      </div>
                      <button onClick={handleExportExcel} disabled={!canExport} className="btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Descargar data ajustada
                      </button>
                    </div>

                    {loading && (
                      <div className="panel flex items-center gap-3">
                        <div className="skeleton h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <div className="skeleton h-4 w-40" />
                          <div className="skeleton h-2 w-full mt-2" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    <FormulasView />
                    <AjustesView logs={logs} />

                    <div className="flex justify-end">
                      <button onClick={handleReset} className="btn-ghost text-sm">Validar otro archivo</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ─── HISTORIAL / VERIFICAR DATA ─── */}
            {section === 'historial' && (
              <HistorialView onNavigate={setSection} templateKey={activeTemplate} />
            )}

            {/* ─── CONSOLIDAR ─── */}
            {section === 'consolidar' && (
              <ConsolidacionView templates={templates} templateKey={activeTemplate} />
            )}

            {/* ─── HISTORIAS CLÍNICAS ─── */}
            {section === 'historias' && (
              <HistoriasView templateKey={activeTemplate} />
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
