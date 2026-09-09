import React, { useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { uploadFile, saveCargue } from '../api'

export default function CargueMasivoIPS({ onCargueComplete }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [step, setStep] = useState('select')
  const [progress, setProgress] = useState(0)
  const [validated, setValidated] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [affiliation, setAffiliation] = useState(null)
  const [validatingAffiliation, setValidatingAffiliation] = useState(false)
  const [error, setError] = useState('')

  const API = (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')

  const handleFile = useCallback((f) => {
    if (!f) return
    setError(''); setValidated(null); setSaved(null); setAffiliation(null)
    if (f.size > 50 * 1024 * 1024) { setError('El archivo excede 50 MB'); return }
    setFile(f)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }, [handleFile])

  const handleValidate = useCallback(async () => {
    if (!file) return
    setStep('validating'); setError(''); setProgress(0)
    try {
      const raw = await uploadFile(file, 'gestante', setProgress, {
        strictMode: false,
        minTemplateCoverage: 95,
        requireExactColumns: true,
        mode: 'validador',
      })
      const decoded = { ...raw }
      if (raw.compressed) {
        try {
          const pako = await import('pako')
          const b64ToBytes = (s) => {
            const bin = atob(s)
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            return bytes
          }
          const decode = (s) => {
            if (typeof s !== 'string' || !s) return s
            try {
              const out = pako.ungzip(b64ToBytes(s), { to: 'string' })
              return typeof out === 'string' ? out : new TextDecoder('utf-8').decode(out)
            } catch { return '' }
          }
          decoded.corrected_text = decode(raw.corrected_text)
          decoded.raw_text = decode(raw.raw_text)
        } catch { /* ignore */ }
      }
      setValidated(decoded)
      setStep('review')
    } catch (e) {
      setError(e.message || 'Error al validar archivo')
      setStep('select')
    }
  }, [file])

  const handleSave = useCallback(async () => {
    if (!validated) return
    setSaving(true); setError('')
    try {
      const summary = validated.summary || {}
      const result = await saveCargue({
        corrected_text: validated.corrected_text || '',
        raw_text: validated.raw_text || '',
        compressed: false,
        template_key: validated.template_key || 'gestante',
        filename: file?.name || 'cargue_ips.txt',
        summary,
        logs: validated.logs_sample || [],
        row_count: summary.total || 0,
        errors_count: summary.errors || 0,
        corrected_count: summary.corrected || 0,
        quality_percent: summary.quality_percent || 0,
      })
      setSaved({ id: result.id, rows: result.row_count, quality: summary.quality_percent })
      setStep('saved')
      if (onCargueComplete) onCargueComplete(result)
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [validated, file, onCargueComplete])

  const handleValidateAffiliation = useCallback(async () => {
    if (!validated?.corrected_text) return
    setValidatingAffiliation(true); setError('')
    try {
      const r = await fetch(`${API}/validate-affiliation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ corrected_text: validated.corrected_text, template_key: 'gestante' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Error validando afiliaciones')
      setAffiliation(data)
    } catch (e) {
      setError(e.message || 'Error validando afiliaciones')
    } finally {
      setValidatingAffiliation(false)
    }
  }, [validated, user?.token, API])

  const reset = useCallback(() => {
    setFile(null); setStep('select'); setValidated(null); setSaved(null)
    setAffiliation(null); setError(''); setProgress(0)
  }, [])

  const summary = validated?.summary || {}
  const hasErrors = (summary.rows_with_errors ?? summary.errors ?? 0) > 0
  const previewRows = validated?.preview_rows || []
  const logsSample = validated?.logs_sample || []

  return (
    <div className="space-y-6 fade-in">
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #1a4731 0%, #15803d 50%, #22c55e 100%)', boxShadow: '0 8px 32px rgba(21,128,61,0.30)' }}>
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="relative p-7">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.02em' }}>Cargue Masivo</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Sube archivos Excel (.xlsx) o TXT con data de gestantes de tu IPS</p>
        </div>
      </div>

      {error && <div className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#991B1B', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>{error}</div>}

      {step === 'select' && (
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Selecciona el archivo a subir</h2>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input-ips').click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-green-400 hover:bg-green-50/30"
            style={{ borderColor: file ? '#15803d' : '#D1D5DB', backgroundColor: file ? '#F0FDF4' : 'transparent' }}
          >
            <input id="file-input-ips" type="file" accept=".txt,.csv,.xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#15803d" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <div className="text-left">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Arrastra el archivo aqui o haz clic para seleccionar</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Formatos: .xlsx, .xls, .txt, .csv — Maximo 50 MB</div>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleValidate} disabled={!file} className="btn-primary" style={{ opacity: !file ? 0.5 : 1 }}>
              Validar archivo
            </button>
          </div>
        </div>
      )}

      {step === 'validating' && (
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="text-center py-8">
            <svg className="animate-spin w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#15803d" strokeWidth="4" /><path className="opacity-75" fill="#15803d" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Validando archivo...</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Aplicando reglas del instructivo y validando columnas</div>
            {progress > 0 && (
              <div className="mt-3 mx-auto" style={{ maxWidth: 300 }}>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#15803d' }} />
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{progress}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'review' && validated && (
        <>
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Resultado de la validacion</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-canvas)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Registros</div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{summary.total || 0}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#DCFCE7' }}>
                <div className="text-xs" style={{ color: '#15803d' }}>Sin errores</div>
                <div className="text-lg font-bold" style={{ color: '#166534' }}>{(summary.total || 0) - (summary.rows_with_errors || 0)}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: hasErrors ? '#FEE2E2' : 'var(--bg-canvas)' }}>
                <div className="text-xs" style={{ color: hasErrors ? '#991B1B' : 'var(--text-muted)' }}>Con errores</div>
                <div className="text-lg font-bold" style={{ color: hasErrors ? '#991B1B' : 'var(--text-primary)' }}>{summary.rows_with_errors || 0}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-canvas)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Calidad</div>
                <div className="text-lg font-bold" style={{ color: (summary.quality_percent || 0) >= 90 ? '#15803d' : (summary.quality_percent || 0) >= 60 ? '#B45309' : '#B91C1C' }}>{summary.quality_percent || 0}%</div>
              </div>
            </div>

            {logsSample.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Muestra de errores (primeros 10):</div>
                <div className="max-h-40 overflow-y-auto rounded-lg p-3 text-xs font-mono" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  {logsSample.slice(0, 10).map((log, i) => (
                    <div key={i} className="py-1" style={{ color: '#991B1B' }}>{typeof log === 'string' ? log : JSON.stringify(log)}</div>
                  ))}
                </div>
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Vista previa (primeras 5 filas):</div>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-subtle)' }}>
                  <table className="text-xs" style={{ minWidth: '100%' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-canvas)' }}>
                        {previewRows[0]?.split('|').slice(0, 10).map((_, i) => (
                          <th key={i} className="px-2 py-1 text-left" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>Col {i + 1}</th>
                        ))}
                        {previewRows[0]?.split('|').length > 10 && <th className="px-2 py-1" style={{ color: 'var(--text-muted)' }}>...</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          {row.split('|').slice(0, 10).map((cell, ci) => (
                            <td key={ci} className="px-2 py-1" style={{ color: 'var(--text-primary)' }}>{cell || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                          ))}
                          {row.split('|').length > 10 && <td className="px-2 py-1" style={{ color: 'var(--text-muted)' }}>...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Validar afiliaciones en tabla af_afiliado</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Verifica que los documentos de identidad de las gestantes existan en la base de datos corporativa.</p>
            <button onClick={handleValidateAffiliation} disabled={validatingAffiliation} className="btn-secondary text-xs" style={{ opacity: validatingAffiliation ? 0.5 : 1 }}>
              {validatingAffiliation ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Validando...
                </span>
              ) : 'Validar afiliaciones'}
            </button>
            {affiliation && (
              <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                <div className="font-semibold mb-1" style={{ color: '#0369A1' }}>Resultado de afiliaciones:</div>
                <div style={{ color: '#0C4A6E' }}>
                  Encontrados: <strong>{affiliation.encontrados || 0}</strong> | No encontrados: <strong>{affiliation.no_encontrados || 0}</strong>
                </div>
                {affiliation.info && <div className="mt-1" style={{ color: '#0C4A6E' }}>{affiliation.info}</div>}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={reset} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.5 : 1 }}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Guardando...
                </span>
              ) : 'Confirmar y guardar'}
            </button>
          </div>
        </>
      )}

      {step === 'saved' && saved && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0' }}>
          <div className="font-semibold mb-1">Cargue guardado exitosamente</div>
          <div className="text-xs" style={{ color: '#15803D' }}>
            ID: {saved.id} — {saved.rows} registros — {saved.quality}% calidad
          </div>
          <button onClick={reset} className="mt-3 text-xs font-medium underline" style={{ color: '#15803d' }}>Subir otro archivo</button>
        </div>
      )}

      {step !== 'validating' && (
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recomendaciones</h3>
          <ul className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />El archivo debe ser un Excel (.xlsx) o TXT con 200 columnas separadas por pipe (|)</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />La primera fila debe contener los encabezados de las variables</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />Todos los registros deben pertenecer a tu IPS</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />El sistema validara automaticamente la calidad de la data</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />Se verificara la afiliacion de cada gestante en la tabla af_afiliado</li>
          </ul>
        </div>
      )}
    </div>
  )
}
