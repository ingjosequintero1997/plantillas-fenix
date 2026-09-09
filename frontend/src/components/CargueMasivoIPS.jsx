import React, { useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'

const ACCEPTED = '.txt,.csv,.xlsx,.xls'
const MAX_SIZE_MB = 50

export default function CargueMasivoIPS({ onCargueComplete }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [templateKey, setTemplateKey] = useState('gestante')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const API = (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    setResult(null)
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo excede ${MAX_SIZE_MB} MB`)
      return
    }
    setFile(f)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setError('')
    setResult(null)
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo excede ${MAX_SIZE_MB} MB`)
      return
    }
    setFile(f)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const text = await file.text()
      const compressed = false
      const r = await fetch(`${API}/cargues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          corrected_text: text,
          raw_text: text,
          template_key: templateKey,
          original_filename: file.name,
          compressed,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Error al cargar archivo')
      setResult({
        id: data.id,
        filename: file.name,
        rows: data.row_count,
        quality: data.quality_percent,
        errors: data.errors_count,
      })
      setFile(null)
      if (onCargueComplete) onCargueComplete(data)
    } catch (e) {
      setError(e.message || 'Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }, [file, templateKey, user?.token, API, onCargueComplete])

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C4A6F 50%, #4A6FA5 100%)', boxShadow: '0 8px 32px rgba(44,74,111,0.30)' }}>
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="relative p-7">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.02em' }}>Cargue Masivo de Data</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Sube archivos Excel, TXT o CSV con datos de gestantes</p>
        </div>
      </div>

      {error && <div className="px-4 py-2 rounded-md text-sm" style={{ color: '#DC2626', backgroundColor: '#FEE2E2' }}>{error}</div>}

      {result && (
        <div className="px-4 py-3 rounded-md text-sm" style={{ color: '#15803D', backgroundColor: '#DCFCE7' }}>
          <div className="font-medium mb-1">Archivo cargado exitosamente</div>
          <div className="text-xs" style={{ color: '#166534' }}>
            Archivo: {result.filename} | Registros: {result.rows} | Calidad: {result.quality}% | Errores: {result.errors}
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2C4A6F' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Subir archivo</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Formatos aceptados: Excel (.xlsx, .xls), TXT, CSV</p>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
          style={{ borderColor: file ? '#2C4A6F' : 'var(--border-subtle)', backgroundColor: file ? '#F0F5FA' : 'var(--bg-canvas)' }}
          onClick={() => document.getElementById('file-input-ips').click()}
        >
          <input id="file-input-ips" type="file" accept={ACCEPTED} onChange={handleFile} className="hidden" />
          {file ? (
            <div>
              <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="#2C4A6F" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Arrastra un archivo aqui o haz clic para seleccionar</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Maximo {MAX_SIZE_MB} MB</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 mt-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Plantilla</label>
            <select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} className="input" style={{ minWidth: 160 }}>
              <option value="gestante">Gestante</option>
              <option value="citologia">Citologia</option>
              <option value="mamografia">Mamografia</option>
              <option value="penta">Penta</option>
            </select>
          </div>
          <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary" style={{ opacity: !file || uploading ? 0.5 : 1 }}>
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Subiendo...
              </span>
            ) : 'Subir archivo'}
          </button>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Instrucciones</h3>
        <ul className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#2C4A6F' }} />El archivo debe contener 200 columnas separadas por pipe (|) o tabulacion</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#2C4A6F' }} />La primera fila debe ser el encabezado con los nombres de las variables</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#2C4A6F' }} />Los registros deben pertenecer a tu IPS</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#2C4A6F' }} />El sistema validara la calidad de los datos automaticamente</li>
        </ul>
      </div>
    </div>
  )
}
