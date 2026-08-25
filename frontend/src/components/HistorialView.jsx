import React, { useEffect, useMemo, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import * as pako from 'pako'
import { fetchCargues, fetchCargue, deleteCargue, descargarCargueExcel, descargarCargueTxt } from '../api'
import ErrorSummaryTable from './ErrorSummaryTable'

const PER_PAGE = 12

function b64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function decompress(data) {
  const decode = (s) => {
    if (typeof s !== 'string' || !s) return s
    try {
      const out = pako.ungzip(b64ToBytes(s), { to: 'string' })
      if (typeof out === 'string') return out
      return new TextDecoder('utf-8').decode(out)
    } catch (e) { return '' }
  }
  if (data.compressed) return { ...data, corrected_text: decode(data.corrected_text), raw_text: decode(data.raw_text) }
  return data
}

function CalidadBadge({ value }) {
  if (value >= 95) return <span className="badge-success">{value}%</span>
  if (value >= 80) return <span className="badge-warning">{value}%</span>
  return <span className="badge-error">{value}%</span>
}

function DeleteConfirmModal({ filename, onConfirm, onCancel, loading }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, backgroundColor: 'rgba(15,15,15,0.35)', backdropFilter: 'blur(2px)' }}
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
        style={{ border: '1px solid var(--border-subtle)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Eliminar cargue</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Esta accion no se puede deshacer.</div>
          </div>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Se eliminara permanentemente el cargue <strong className="font-medium" style={{ color: 'var(--text-primary)' }}>{filename}</strong> y todos sus datos asociados.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2" disabled={loading}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="text-sm px-4 py-2 rounded-lg font-medium text-white transition-all" style={{ backgroundColor: loading ? '#F87171' : '#DC2626' }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#B91C1C' }} onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#DC2626' }}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function CargueDetail({ cargue, onBack }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true); setError('')
      try {
        const data = await fetchCargue(cargue.id)
        if (mounted) setDetail(decompress(data))
      } catch (e) { if (mounted) setError('No fue posible cargar el detalle del cargue.') }
      finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [cargue.id])

  const handleDownload = async (tipo) => {
    setDownloading(tipo); setError('')
    try {
      const base = (cargue.original_filename || 'data_validada').replace(/\.(xlsx|xls|txt)$/i, '')
      if (tipo === 'excel') await descargarCargueExcel(cargue.id, `${base}_ajustada.xlsx`)
      else await descargarCargueTxt(cargue.id, `${base}_ajustada.txt`)
    } catch (e) {
      setError(e.message || 'Error al descargar')
    } finally {
      setDownloading('')
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <button onClick={onBack} className="btn-ghost text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Volver a la lista
      </button>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-6 w-64" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-24 w-full" />
        </div>
      ) : detail && (
        <>
          <div>
            <div className="page-title">{cargue.original_filename}</div>
            <div className="page-subtitle">
              {cargue.prestador ? `${cargue.prestador} · ` : ''}Validado el {new Date(cargue.created_at).toLocaleString('es-CO')}
            </div>
          </div>

          {/* Resumen en linea */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-5 border-y" style={{ borderColor: 'var(--border)' }}>
            <div><div className="stat-label">Registros</div><div className="stat-value">{detail.row_count ?? 0}</div></div>
            <div><div className="stat-label">Errores</div><div className="stat-value" style={{ color: detail.errors_count ? 'var(--error)' : 'var(--success)' }}>{detail.errors_count ?? 0}</div></div>
            <div><div className="stat-label">Corregidos</div><div className="stat-value">{detail.corrected_count ?? 0}</div></div>
            <div><div className="stat-label">Calidad</div><div className="stat-value">{detail.quality_percent ?? 0}%</div></div>
          </div>

          {/* Descarga */}
          <div className="panel flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium" style={{ color: 'var(--text)' }}>Data ajustada</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Descarga el archivo con los datos corregidos.</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDownload('excel')} disabled={downloading !== ''} className="btn-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {downloading === 'excel' ? 'Descargando...' : 'Descargar Excel'}
              </button>
              <button onClick={() => handleDownload('txt')} disabled={downloading !== ''} className="btn-secondary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {downloading === 'txt' ? 'Descargando...' : 'TXT'}
              </button>
            </div>
          </div>

          <ErrorSummaryTable logs={Array.isArray(detail.logs_sample) ? detail.logs_sample : []} />
        </>
      )}
    </div>
  )
}

export default function HistorialView({ onNavigate, templateKey = '' }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadRecords = useCallback(async () => {
    setLoading(true); setError('')
    try { setRecords(await fetchCargues(templateKey)) }
    catch (e) { setError('No se pudieron cargar los cargues.') }
    finally { setLoading(false) }
  }, [templateKey])

  useEffect(() => { loadRecords() }, [loadRecords])

  const handleDelete = useCallback(async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await deleteCargue(deleting.id)
      setRecords((prev) => prev.filter((r) => r.id !== deleting.id))
      setDeleting(null)
    } catch (e) {
      let msg = 'No se pudo eliminar el cargue.'
      try {
        const parsed = JSON.parse(e.message)
        if (parsed.detail) msg = parsed.detail
      } catch { /* ignore */ }
      setError(msg)
      setDeleting(null)
    } finally {
      setDeleteLoading(false)
    }
  }, [deleting])

  const handleDownloadRow = useCallback(async (r) => {
    setError('')
    try {
      const base = (r.original_filename || 'data_validada').replace(/\.(xlsx|xls|txt)$/i, '')
      await descargarCargueExcel(r.id, `${base}_ajustada.xlsx`)
    } catch (e) {
      setError(e.message || 'Error al descargar')
    }
  }, [])

  const handleCloseDelete = useCallback(() => setDeleting(null), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((r) => !q || `${r.original_filename} ${r.prestador ?? ''} ${r.mes}`.toLowerCase().includes(q))
  }, [records, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (selected) return <CargueDetail cargue={selected} onBack={() => setSelected(null)} />

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title">Verificar data</div>
          <div className="page-subtitle">Cargues de los prestadores y su calidad de validacion.</div>
        </div>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      {records.length === 0 && !loading ? (
        <div className="empty">
          <div className="empty-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="empty-title">Aun no hay cargues</div>
          <div className="empty-desc">Cuando los prestadores suban su data mensual, aparecera aqui con su resumen de validacion.</div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por archivo o prestador..." className="input pl-9" />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{filtered.length} cargues</span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Archivo</th>
                  <th>Prestador</th>
                  <th>Mes</th>
                  <th>Plantilla</th>
                  <th className="text-center">Registros</th>
                  <th className="text-center">Errores</th>
                  <th className="text-center">Calidad</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center" style={{ width: 90 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.id}>
                    <td className="table-row-click whitespace-nowrap" onClick={() => setSelected(r)} style={{ color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString('es-CO')}</td>
                    <td className="table-row-click" onClick={() => setSelected(r)}>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-md shrink-0" style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </span>
                        <span className="font-medium">{r.original_filename}</span>
                      </div>
                    </td>
                    <td className="table-row-click" onClick={() => setSelected(r)} style={{ color: 'var(--text-secondary)' }}>{r.prestador || '\u2014'}</td>
                    <td className="table-row-click" onClick={() => setSelected(r)}><span className="badge-neutral">{r.mes}</span></td>
                    <td className="table-row-click uppercase text-xs" onClick={() => setSelected(r)} style={{ color: 'var(--text-secondary)' }}>{r.template_key || '\u2014'}</td>
                    <td className="table-row-click text-center font-medium" onClick={() => setSelected(r)}>{r.row_count ?? 0}</td>
                    <td className="table-row-click text-center" onClick={() => setSelected(r)} style={{ color: r.errors_count ? 'var(--error)' : 'var(--success)' }}>{r.errors_count ?? 0}</td>
                    <td className="table-row-click text-center" onClick={() => setSelected(r)}><CalidadBadge value={r.quality_percent ?? 0} /></td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                        Validado
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadRow(r) }}
                          title="Descargar data validada (Excel)"
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--green-600)'; e.currentTarget.style.backgroundColor = '#E6F0FA' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleting(r) }}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.backgroundColor = '#FEE2E2' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                          title="Eliminar cargue"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pagina {safePage} de {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2.5 py-1 text-xs">&larr;</button>
                  <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2.5 py-1 text-xs">&rarr;</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {deleting && (
        <DeleteConfirmModal
          filename={deleting.original_filename}
          onConfirm={handleDelete}
          onCancel={handleCloseDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}
