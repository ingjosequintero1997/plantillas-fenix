import { useState, useRef } from 'react'
import { uploadFile, fetchTemplates, evaluateData } from '../api'
import { generateExcel } from '../excelGenerator'
import ExcelJS from 'exceljs'
import Pagination from './Pagination'

const PATIENTS_PER_PAGE = 50

export default function AuditoriaExport({ onClose }) {
  const [templates, setTemplates] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [evalData, setEvalData] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [filterKey, setFilterKey] = useState('all')
  const [patientPage, setPatientPage] = useState(1)
  const inputRef = useRef()

  useState(() => {
    fetchTemplates().then(data => {
      setTemplates(data)
      if (data.length) setSelectedKey(data[0].key)
    }).catch(() => setError('Error al cargar plantillas'))
  })

  const handleProcess = async () => {
    if (!file || !selectedKey) return
    setLoading(true); setError(''); setProgress(0); setResult(null); setEvalData(null)
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
        patients: df,
        columns: templateNames,
        correctedText: rawText,
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

  const handleEvaluate = async () => {
    if (!result || !result.correctedText) return
    setEvalLoading(true); setError(''); setEvalData(null); setFilterKey('all'); setPatientPage(1)
    try {
      const evaluation = await evaluateData(result.correctedText, result.templateNames, selectedKey, 'json')
      setEvalData(evaluation)
    } catch (e) {
      setError(e.message || 'Error al evaluar indicadores')
    } finally {
      setEvalLoading(false)
    }
  }

  const handleDownloadOrganized = async () => {
    if (!result) return
    try {
      const wb = new ExcelJS.Workbook()
      wb.creator = 'FÉNIX - Validador de Plantillas PYM'
      wb.created = new Date()
      const ws = wb.addWorksheet('Datos', { properties: { tabColor: { argb: 'FF7C3AED' } } })

      const columns = result.columns
      const patients = result.patients

      const headerRow = ws.getRow(1)
      columns.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF7C3AED' } },
          left: { style: 'thin', color: { argb: 'FF7C3AED' } },
          bottom: { style: 'thin', color: { argb: 'FF7C3AED' } },
          right: { style: 'thin', color: { argb: 'FF7C3AED' } },
        }
      })
      headerRow.height = 24

      patients.forEach((p, idx) => {
        const row = ws.getRow(2 + idx)
        const alt = idx % 2 === 1
        columns.forEach((col, ci) => {
          const cell = row.getCell(ci + 1)
          cell.value = p[col] || ''
          cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF2D3748' } }
          cell.alignment = { vertical: 'middle', wrapText: true }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
          if (alt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0FF' } }
        })
        row.height = 20
      })

      ws.getColumns().forEach((col, i) => {
        const maxLen = Math.max(
          columns[i] ? columns[i].length : 10,
          ...patients.map(p => String(p[columns[i]] || '').length)
        )
        col.width = Math.min(Math.max(maxLen + 3, 12), 60)
      })

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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

  const handleDownloadEval = async () => {
    if (!evalData) return
    try {
      const blob = await generateExcel(evalData)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evaluacion_${selectedKey}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Error al generar Excel de evaluación')
    }
  }

  const formatBytes = (b) => {
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1048576).toFixed(1)} MB`
  }

  const patientsWithFlags = (() => {
    if (!evalData) return []
    return evalData.patients.map((p, idx) => {
      const row = { _index: idx + 1 }
      for (const col of evalData.data_columns) {
        row[col] = p[col] ?? ''
      }
      for (const col of evalData.eval_columns) {
        row[col] = p[col] ?? 'NO'
      }
      const n1 = p['NOMBRE_1'] || p['PRIMER NOMBRE'] || ''
      const n2 = p['NOMBRE_2'] || p['SEGUNDO NOMBRE'] || ''
      const a1 = p['APELLIDO_1'] || p['PRIMER APELLIDO'] || ''
      const a2 = p['APELLIDO_2'] || p['SEGUNDO APELLIDO'] || ''
      const parts = [n1, n2, a1, a2].filter(Boolean)
      row._nombreCompleto = parts.join(' ') || '—'
      row._documento = p['NUMERO DE IDENTIFICACIÓN'] || p['NUMERO DE DOCUMENTO'] || p['IDENTIFICACION'] || ''
      return row
    })
  })()

  const filteredPatients = (() => {
    if (filterKey === 'all') return patientsWithFlags
    const [col, val] = filterKey.split('::')
    return patientsWithFlags.filter((p) => String(p[col]).toUpperCase() === val)
  })()

  const paginatedPatients = filteredPatients.slice((patientPage - 1) * PATIENTS_PER_PAGE, patientPage * PATIENTS_PER_PAGE)
  const patientTotalPages = Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE)

  const SHORT_LABELS = {
    'Diabéticos controlados': 'DM controlado',
    'Control PA < 140/90': 'PA <140/90',
    'Control PA < 150/90': 'PA <150/90',
    'Captación HTA 18-69 subsidiado': 'Capt. HTA',
    'Captación DM 18-69 subsidiado': 'Capt. DM',
  }

  const barColor = (val) => {
    if (val >= 80) return 'bg-green-500'
    if (val >= 60) return 'bg-amber-500'
    return 'bg-red-500'
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
            Carga el TXT del sistema de validación, selecciona la plantilla y descarga un Excel con los datos organizados en cada variable correspondiente.
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
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); setEvalData(null); setError('') } }} />
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

        {/* Step 3: Process & export */}
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
                <button onClick={handleDownloadOrganized}
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

        {/* Evaluation button (solo RCV) */}
        {result && selectedKey === 'rcv' && !evalLoading && !evalData && (
          <div className="flex justify-center">
            <button onClick={handleEvaluate}
              className="btn-accent text-sm px-8 py-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Evaluación de indicadores
            </button>
          </div>
        )}

        {evalLoading && (
          <div className="flex items-center justify-center gap-3 text-sm text-ink-muted bg-brand-50 rounded-xl px-5 py-4 border border-brand-200/50">
            <svg className="w-5 h-5 text-brand-700 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Evaluando indicadores...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-xs text-red-600 flex items-start gap-2">
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ─── Evaluation Dashboard (inline) ─── */}
        {evalData && (
          <div className="space-y-5 pt-4 border-t-2 border-brand-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 rounded-full bg-amber-600" />
                <h3 className="text-base font-bold text-ink tracking-tight">Evaluación de indicadores RCV</h3>
              </div>
              <button onClick={handleDownloadEval}
                className="btn bg-amber-600 text-white hover:bg-amber-700 shadow-button text-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Excel evaluación
              </button>
            </div>

            {/* KPI cards */}
            <div className="grid gap-3 md:grid-cols-5">
              {evalData.indicators.map((ind) => {
                const val = parseFloat(String(ind.CUMPLIMIENTO).replace('%', '').replace(',', '.'))
                const isGood = val >= (ind.META || 80)
                return (
                  <div key={ind.INDICADOR} className="rounded-xl border border-ink-line/60 bg-white p-4 text-center">
                    <div className="text-[0.45rem] font-bold uppercase tracking-wider text-ink-muted mb-1.5">{SHORT_LABELS[ind.INDICADOR] || ind.INDICADOR}</div>
                    <div className={`text-2xl font-extrabold ${isGood ? 'text-green-600' : 'text-red-500'}`}>
                      {isNaN(val) ? '—' : `${val.toFixed(1)}%`}
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor(val)}`} style={{ width: `${Math.min(val, 100)}%` }} />
                    </div>
                    <div className="mt-1 text-[0.45rem] text-ink-muted font-medium">
                      {ind.NUMERADOR}/{ind.DENOMINADOR}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Patient filter & table */}
            <div className="rounded-xl border border-ink-line/60 overflow-hidden bg-white">
              <div className="p-4 border-b border-ink-line/60 bg-surface-50/50 flex items-center gap-3 flex-wrap">
                <span className="text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Filtrar pacientes:</span>
                <select value={filterKey} onChange={(e) => { setFilterKey(e.target.value); setPatientPage(1) }}
                  className="select text-xs max-w-xs">
                  <option value="all">Todos ({evalData.total_patients || filteredPatients.length})</option>
                  {evalData.eval_columns.map(col => (
                    <option key={`${col}::SI`} value={`${col}::SI`}>✓ {col}</option>
                  ))}
                  {evalData.eval_columns.map(col => (
                    <option key={`${col}::NO`} value={`${col}::NO`}>✗ {col}</option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto scroll-thin">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-surface-50 border-b border-ink-line/60">
                      <th className="px-3 py-2 text-left text-[0.45rem] font-bold uppercase tracking-wider text-ink-muted">#</th>
                      <th className="px-3 py-2 text-left text-[0.45rem] font-bold uppercase tracking-wider text-ink-muted">Documento</th>
                      <th className="px-3 py-2 text-left text-[0.45rem] font-bold uppercase tracking-wider text-ink-muted">Nombre</th>
                      {evalData.eval_columns.map(col => (
                        <th key={col} className="px-3 py-2 text-center text-[0.45rem] font-bold uppercase tracking-wider text-ink-muted">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPatients.map(p => (
                      <tr key={p._index} className="border-b border-surface-100 hover:bg-brand-50/20 transition-colors">
                        <td className="px-3 py-2 text-ink-muted font-semibold">{p._index}</td>
                        <td className="px-3 py-2 font-mono text-ink">{p._documento}</td>
                        <td className="px-3 py-2 text-ink">{p._nombreCompleto}</td>
                        {evalData.eval_columns.map(col => {
                          const v = String(p[col] || '').toUpperCase()
                          return (
                            <td key={col} className="px-3 py-2 text-center">
                              <span className={`inline-block w-5 h-5 rounded-full text-[0.4rem] font-bold flex items-center justify-center ${
                                v === 'SI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}>
                                {v === 'SI' ? '✓' : '✗'}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    {paginatedPatients.length === 0 && (
                      <tr>
                        <td colSpan={3 + evalData.eval_columns.length} className="px-3 py-6 text-center text-ink-muted text-xs">No hay pacientes con este filtro</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-ink-line/60 bg-surface-50/50">
                <Pagination page={patientPage} totalPages={patientTotalPages} onChange={setPatientPage} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
