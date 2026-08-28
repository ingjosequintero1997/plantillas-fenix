import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardHome from './components/DashboardHome'
import TemplateSelector from './components/TemplateSelector'
import QualityBanner from './components/QualityBanner'
import ValidationLogTable from './components/ValidationLogTable'
import FormularioRegistro from './components/FormularioRegistro'
import DragDrop from './components/DragDrop'
import MappingEditor from './components/MappingEditor'
import DataGridTable from './components/DataGridTable'
import Pagination from './components/Pagination'
// Vistas pesadas con carga diferida (se cargan solo al navegar a ellas)
const HistorialView = lazy(() => import('./components/HistorialView'))
const PrestadoresView = lazy(() => import('./components/PrestadoresView'))
const IndicadoresView = lazy(() => import('./components/IndicadoresView'))
const ConsolidacionView = lazy(() => import('./components/ConsolidacionView'))
const HistoriasView = lazy(() => import('./components/HistoriasView'))
const EvaluationDashboard = lazy(() => import('./components/EvaluationDashboard'))
import { fetchTemplates, uploadFile, saveCargue, descargarReporteErroresExcelData, descargarReporteErroresExcel } from './api'
import { guardarUltimaData } from './dataStore'
import * as pako from 'pako'

const AUDIT_PER_PAGE = 50

function b64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToB64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

// Comprime un string con gzip (pako) y lo devuelve como base64.
// Se usa para guardar la data validada en localStorage sin exceder el limite.
function compressToB64(text) {
  const bytes = pako.gzip(text)
  return bytesToB64(bytes)
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
  const [processingMode, setProcessingMode] = useState('validador')
  const [lastCargueId, setLastCargueId] = useState('')

  const isAdmin = user?.role === 'admin'
  // Los prestadores y lideres solo validan: forzar modo validador para ellos.
  useEffect(() => {
    if (!isAdmin && processingMode === 'limpiador') {
      setProcessingMode('validador')
    }
  }, [isAdmin, processingMode])

  const hasDataLoaded = Boolean(rawText)

  const pct = Number(summary?.quality_percent ?? 0)
  const pctColor = pct >= 90 ? 'var(--success)' : pct >= 60 ? '#B45309' : '#B91C1C'
  const pctBg = pct >= 90 ? 'var(--green-50)' : pct >= 60 ? '#FEF3C7' : '#FEE2E2'

  useEffect(() => {
    // Cargar plantillas cuando el usuario esta autenticado (y al montar si ya hay sesion).
    if (!user) return
    let cancelled = false
    const loadTemplates = async (attempt = 0) => {
      try {
        const data = await fetchTemplates()
        if (cancelled) return
        if (data.length > 0) {
          setTemplates(data)
          if (!data.find((item) => item.key === selectedTemplate)) {
            setSelectedTemplate(data[0].key)
          }
          setError('')
        } else {
          throw new Error('Sin plantillas')
        }
      } catch (e) {
        if (cancelled) return
        if (attempt < 3) {
          setTimeout(() => loadTemplates(attempt + 1), 400)
        } else {
          setError('No fue posible cargar los módulos. Verifica tu conexión e intenta de nuevo.')
          setTimeout(() => loadTemplates(0), 8000)
        }
      }
    }
    loadTemplates()
    return () => { cancelled = true }
  }, [user])

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
    setRawText(data.raw_text || '')
    setTemplateNames(data.template_names || [])
    setMappingStats(data.mapping_stats || null)
    setStructureValidation(data.structure_validation || null)

    // Guardar la data validada para que el modulo de indicadores pueda leerla
    // sin depender de la BD. Se comprime con gzip para caber en localStorage.
    try {
      const corrected = data.corrected_text || ''
      const raw = data.raw_text || rawText || ''
      if (corrected || raw) {
        const texto = corrected || raw
        let compressedText = ''
        let esCompresion = false
        try {
          compressedText = compressToB64(String(texto))
          esCompresion = true
        } catch (e) { /* no se pudo comprimir */ }
        const payload = JSON.stringify({
          template_key: incomingTemplateKey,
          corrected_text: esCompresion ? compressedText : String(texto),
          compressed: esCompresion,
          template_names: data.template_names || [],
          saved_at: new Date().toISOString(),
        })
        try { sessionStorage.setItem('ultima_data_validada', payload) } catch (e) { /* limite excedido */ }
        try { localStorage.setItem('ultima_data_validada', payload) } catch (e) { /* limite excedido */ }
        // Variable global en memoria: siempre disponible en la sesion actual,
        // sin limites de tamano ni problemas de persistencia.
        try { window.__ultimaDataValidada = payload } catch (e) { /* ignore */ }
        // Store global en memoria (dataStore): mas confiable que window,
        // compartido entre App.jsx e IndicadoresView.
        guardarUltimaData({
          template_key: incomingTemplateKey,
          corrected_text: texto,
          compressed: false,
          template_names: data.template_names || [],
          saved_at: new Date().toISOString(),
        })
      }
    } catch (e) { /* ignore */ }
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
    const summary = data.summary || {}
    // Regla "todo o nada": solo se valida/guarda la data si no tiene errores.
    const tieneErrores = (summary.rows_with_errors ?? summary.errors ?? 0) > 0
    const item = {
      fileName: file.name, templateKey: selectedTemplate,
      mapping: data.mapping_suggested || data.mapping || {},
      summary, logs: data.logs_sample || [],
      correctedText: data.corrected_text || '', rawText: data.raw_text || '',
      templateNames: data.template_names || [],
      valido: !tieneErrores,
    }
    // Regla "todo o nada": solo se guarda en la BD la data validada sin errores.
    if (!tieneErrores) {
      try {
        const saved = await saveCargue({
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
        if (saved && saved.id) setLastCargueId(String(saved.id))
      } catch (e) {
        console.warn('No se pudo guardar el cargue:', e)
        setError('No se pudo guardar el cargue en el historial: ' + (e.message || 'error'))
      }
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
    setSection('subir')
  }

  const handleSelectTemplate = (key) => {
    setSelectedTemplate(key)
    setCurrentTemplateLabel(templates.find((item) => item.key === key)?.label || key)
    setTemplateNames([]); setMapping({}); setSummary(null); setLogs([]); setCorrectedText('')
    setActiveTemplate(key)
  }

  const handleDownloadReport = async () => {
    try {
      setError('')
      const fecha = new Date().toISOString().slice(0, 10)
      const filename = `reporte_errores_${selectedTemplate}_${fecha}.xlsx`
      // 1) Si hay data en memoria (validacion actual), generar Excel directo.
      if (rawText && rawText.trim()) {
        await descargarReporteErroresExcelData(rawText, selectedTemplate, filename)
        // Volver al estado de validacion para re-subir la data corregida.
        handleReset()
        return
      }
      // 2) Si hay un cargue validado en BD, descargar el Excel desde el backend.
      if (lastCargueId) {
        await descargarReporteErroresExcel(lastCargueId, filename)
        handleReset()
        return
      }
    } catch (e) {
      setError(e.message || 'Error al descargar el reporte de errores')
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
                error={error}
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
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Registra gestante por formulario</div>
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

                    {tipoCargue === 'mensual' ? (
                      /* Cargue mensual: registro por registro via formulario */
                      <FormularioRegistro
                        templateKey={selectedTemplate || 'gestante'}
                        registros={[]}
                        onRegistrado={() => {}}
                        onCancelar={() => {}}
                      />
                    ) : (
                      /* Cargue masivo: subida de archivo */
                      <>
                        <DragDrop onFile={handleFile} />

                        {/* Modo de procesamiento */}
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
                            {isAdmin && (
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
                            )}
                          </div>
                          {!isAdmin && (
                            <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                              <svg className="w-3.5 h-3.5" style={{ color: 'var(--green-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Como prestador validas la data contra el instructivo. Solo el administrador puede aplicar el modo limpiador.
                            </div>
                          )}
                        </div>

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
                        <span className={`badge ${processingMode === 'validador' ? 'badge-warning' : 'badge-success'}`}>
                          Modo: {processingMode === 'validador' ? 'Validador' : 'Limpiador'}
                        </span>
                        {currentTemplateLabel && <span className="badge-neutral">Data detectada: {currentTemplateLabel}</span>}
                      </div>
                    </div>

                    {/* Resumen en tarjetas */}
                    <div className={`grid gap-3 ${processingMode === 'limpiador' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                      <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(28,28,26,0.05)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ color: 'var(--green-700)', backgroundColor: 'var(--green-50)' }}>
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div>
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Registros</div>
                            <div className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{summary.total}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(28,28,26,0.05)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ color: (summary.rows_with_errors ?? summary.errors) ? '#B91C1C' : 'var(--green-700)', backgroundColor: (summary.rows_with_errors ?? summary.errors) ? '#FEE2E2' : 'var(--green-50)' }}>
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                          </div>
                          <div>
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Con errores</div>
                            <div className="text-xl font-bold leading-tight" style={{ color: (summary.rows_with_errors ?? summary.errors) ? '#B91C1C' : 'var(--success)', fontFamily: 'var(--font-display)' }}>
                              {summary.rows_with_errors ?? 0} <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>de {summary.total}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {processingMode === 'limpiador' && (
                        <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(28,28,26,0.05)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ color: 'var(--green-700)', backgroundColor: 'var(--green-50)' }}>
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                              <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Celdas corregidas</div>
                              <div className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{summary.corrected ?? 0}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(28,28,26,0.05)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ color: pctColor, backgroundColor: pctBg }}>
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Calidad</div>
                            <div className="text-xl font-bold leading-tight" style={{ color: pctColor, fontFamily: 'var(--font-display)' }}>{summary.quality_percent}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumen visual de calidad (modo validador) */}
                    {processingMode === 'validador' && <QualityBanner summary={summary} mode="validador" />}

                    {/* Log de validación: errores visibles para el prestador */}
                    {processingMode === 'validador' && logs.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#B91C1C" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Errores de validación</div>
                        </div>
                        <ValidationLogTable logs={logs} />
                      </div>
                    )}

                    {/* Panel informativo: descargar Excel de errores para corregir */}
                    <div className="panel flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>Para corregir los errores</div>
                        <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Descarga el Excel de errores, corrige los datos marcados en rojo y vuelve a subir el archivo.
                        </div>
                      </div>
                      <button onClick={handleDownloadReport} disabled={!rawText} className="btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Descargar errores (Excel)
                      </button>
                    </div>

                    {/* Barra de acciones al final */}
                    <div className="panel flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>¿Terminaste esta validación?</div>
                        <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {(summary.rows_with_errors ?? summary.errors) > 0
                            ? 'Descarga el Excel de errores para corregir y re-subir la data.'
                            : 'Tu data quedó al 100%. Descárgala desde Verificar data.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ─── HISTORIAL / VERIFICAR DATA ─── */}
            {section === 'historial' && (
              <Suspense fallback={<div className="skeleton h-40 w-full rounded-xl" />}>
                <HistorialView onNavigate={setSection} templateKey={activeTemplate} />
              </Suspense>
            )}

            {/* ─── CONSOLIDAR ─── */}
            {section === 'consolidar' && (
              <Suspense fallback={<div className="skeleton h-40 w-full rounded-xl" />}>
                <ConsolidacionView templates={templates} templateKey={activeTemplate} />
              </Suspense>
            )}

            {/* ─── HISTORIAS CLÍNICAS ─── */}
            {section === 'historias' && (
              <Suspense fallback={<div className="skeleton h-40 w-full rounded-xl" />}>
                <HistoriasView templateKey={activeTemplate} />
              </Suspense>
            )}

            {/* ─── PRESTADORES (admin) ─── */}
            {section === 'prestadores' && (
              <Suspense fallback={<div className="skeleton h-40 w-full rounded-xl" />}>
                <PrestadoresView />
              </Suspense>
            )}

            {/* ─── INDICADORES ─── */}
            {section === 'indicadores' && (
              <Suspense fallback={<div className="skeleton h-40 w-full rounded-xl" />}>
                <IndicadoresView templateKey={activeTemplate} dataValidada={correctedText || rawText} templateNames={templateNames} />
              </Suspense>
            )}

          </DashboardLayout>
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
