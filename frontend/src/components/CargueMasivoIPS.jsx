import React, { useState, useCallback } from 'react'
import { useAuth } from '../AuthContext'

export default function CargueMasivoIPS({ onCargueComplete }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const API = (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError(''); setResult(null)
    if (f.size > 50 * 1024 * 1024) { setError('El archivo excede 50 MB'); return }
    setFile(f)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setError(''); setResult(null)
    if (f.size > 50 * 1024 * 1024) { setError('El archivo excede 50 MB'); return }
    setFile(f)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true); setError(''); setResult(null)
    try {
      const text = await file.text()
      const r = await fetch(`${API}/cargues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          corrected_text: text,
          raw_text: text,
          template_key: 'gestante',
          original_filename: file.name,
          compressed: false,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Error al cargar archivo')
      setResult({ id: data.id, filename: file.name, rows: data.row_count, quality: data.quality_percent, errors: data.errors_count })
      setFile(null)
      if (onCargueComplete) onCargueComplete(data)
    } catch (e) {
      setError(e.message || 'Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }, [file, user?.token, API, onCargueComplete])

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

      {result && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0' }}>
          <div className="font-semibold mb-1">Cargue exitoso</div>
          <div className="text-xs" style={{ color: '#15803D' }}>
            {result.filename} — {result.rows} registros — {result.quality}% calidad — {result.errors} errores
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Selecciona el archivo a subir</h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input-ips').click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-green-400 hover:bg-green-50/30"
          style={{ borderColor: file ? '#15803d' : '#D1D5DB', backgroundColor: file ? '#F0FDF4' : 'transparent' }}
        >
          <input id="file-input-ips" type="file" accept=".txt,.csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
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

      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recomendaciones</h3>
        <ul className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />El archivo debe ser un Excel (.xlsx) o TXT con 200 columnas separadas por pipe (|)</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />La primera fila debe contener los encabezados de las variables</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />Todos los registros deben pertenecer a tu IPS</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#15803d' }} />El sistema validara automaticamente la calidad de la data</li>
        </ul>
      </div>
    </div>
  )
}
