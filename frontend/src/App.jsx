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
import IndicadoresView from './components/IndicadoresView'
import ErrorSummaryTable from './components/ErrorSummaryTable'
import EditableDataTable from './components/EditableDataTable'
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
  const [tipoCargue, setTipoCargue] = useState('mensual')
  const [processingMode, setProcessingMode] = useState('limpiador')

  const hasDataLoaded = Boolean(rawText)
  const canExport = Boolean(correctedText)

  useEffect(() => {
    const loadTemplates = async (attempt = 0) => {
      try {
        const data = await fetchTemplates()
        if (data.length > 0) {
          setTemplates(data)
          if (!data.find((item) => item.key === selectedTemplate)) {
            setSelectedTemplate(data[0].key)
          }
        }
      } catch (e) {
        // Reintenta una vez si el token aún no está listo (evita "No autorizado" al cargar)
        if (attempt < 2) {
          setTimeout(() => loadTemplates(attempt + 1), 600)
          return
        }
        setError('No fue posible cargar las plantillas. Verifica tu sesión.')
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
      strictMode, minTemplateCoverage, requireExactColumns: true, mode: processingMode,
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
            onSelectTemplate={(key) => { handleSelectTemplate(key); setSection('inicio') }}
          >

            {/* ─── INICIO ─── */}
            {section === 'inicio' && (
              <TemplateSelector
                templates={templates}
                onSelect={handleSelectTemplate}
                activeTemplate={activeTemplate}
              />
            )}

            {/* ─── SUBIR DATA / VALIDAR ─── */}
            {section === 'subir' && (
              <div className="space-y-6 fade-in">
                {!summary ? (
                  <>
                    <div>
                      <div className="page-title">Cargues de data</div>
                      <div className="page-subtitle">Selecciona el tipo de cargue y sube tu data para validarla contra el instructivo.</div>
                    </div>

                    {/* Selección de tipo de cargue */}
                    <div className="panel">
                      <div className="section-label mb-3">Tipo de cargue</div>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        <button
                          onClick={() => setTipoCargue('mensual')}
                          className="text-left px-4 py-3 rounded-lg border transition-colors"
                          style={{
                            borderColor: tipoCargue === 'mensual' ? 'var(--accent)' : 'var(--border)',
                            backgroundColor: tipoCargue === 'mensual' ? '#EEF3F7' : 'transparent',
                          }}
                        >
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Cargue mensual</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Data de un período específico</div>
                        </button>
                        <button
                          onClick={() => setTipoCargue('masivo')}
                          className="text-left px-4 py-3 rounded-lg border transition-colors"
                          style={{
                            borderColor: tipoCargue === 'masivo' ? 'var(--accent)' : 'var(--border)',
                            backgroundColor: tipoCargue === 'masivo' ? '#EEF3F7' : 'transparent',
                          }}
                        >
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Cargue masivo</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Todo lo acumulado del año</div>
                        </button>
                      </div>
                      {tipoCargue === 'mensual' && user?.role === 'admin' && (
                        <div className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Los cargues mensuales se pueden consolidar en una sola data desde el módulo <span className="font-medium" style={{ color: 'var(--text)' }}>Consolidar</span>.
                        </div>
                      )}
                    </div>

                    <DragDrop onFile={handleFile} />

                    {/* Modo de procesamiento */}
                    {user?.role === 'admin' && (
                      <div className="panel">
                        <div className="section-label mb-3">Modo de procesamiento</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setProcessingMode('validador')}
                            className="flex-1 text-left px-4 py-3 rounded-lg border transition-colors"
                            style={{
                              borderColor: processingMode === 'validador' ? 'var(--green-500)' : 'var(--border)',
                              backgroundColor: processingMode === 'validador' ? 'var(--green-50)' : 'transparent',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" style={{ color: processingMode === 'validador' ? 'var(--green-600)' : 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <div>
                                <div className="text-sm font-semibold" style={{ color: processingMode === 'validador' ? 'var(--green-700)' : 'var(--text)' }}>Validador</div>
                                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Solo valida, sin ajustar</div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => setProcessingMode('limpiador')}
                            className="flex-1 text-left px-4 py-3 rounded-lg border transition-colors"
                            style={{
                              borderColor: processingMode === 'limpiador' ? 'var(--green-500)' : 'var(--border)',
                              backgroundColor: processingMode === 'limpiador' ? 'var(--green-50)' : 'transparent',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" style={{ color: processingMode === 'limpiador' ? 'var(--green-600)' : 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              <div>
                                <div className="text-sm font-semibold" style={{ color: processingMode === 'limpiador' ? 'var(--green-700)' : 'var(--text)' }}>Limpiador</div>
                                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Ajusta segun instructivo</div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso */}
                    {loading && (
                      <div className="panel">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-4 h-4 animate-spin" style={{ color: 'var(--green-500)' }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Procesando archivo...</span>
                              <span className="text-sm font-medium" style={{ color: 'var(--green-600)' }}>{progress}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-subtle)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: progress < 100 ? 'var(--green-500)' : 'var(--green-600)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {processingMode === 'validador' ? 'Validando datos contra el instructivo...' : 'Limpiando y ajustando datos segun el instructivo...'}
                        </p>
                      </div>
                    )}

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
                      {processingMode === 'limpiador' && (
                        <div><div className="stat-label">Corregidos</div><div className="stat-value">{summary.corrected}</div></div>
                      )}
                      <div><div className="stat-label">Calidad</div><div className="stat-value">{summary.quality_percent}%</div></div>
                    </div>

                    {/* Descarga de data ajustada (solo modo limpiador) */}
                    {processingMode === 'limpiador' && (
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
                    )}

                    {/* Tabla de errores */}
                    <ErrorSummaryTable logs={logs} />

                    {/* Tabla editable (modo validador) */}
                    {processingMode === 'validador' && (
                      <EditableDataTable
                        logs={logs}
                        rawText={rawText}
                        templateNames={templateNames}
                        onRevalidate={async (newText) => {
                          setLoading(true); setError('')
                          try {
                            const data = maybeDecompress(await revalidateData(newText, mapping, selectedTemplate))
                            applyResponse(data)
                          } catch (e) {
                            setError(e.message || 'Error al re-validar')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        loading={loading}
                      />
                    )}

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

            {/* ─── INDICADORES ─── */}
            {section === 'indicadores' && (
              <IndicadoresView templateKey={activeTemplate} />
            )}

          </DashboardLayout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
