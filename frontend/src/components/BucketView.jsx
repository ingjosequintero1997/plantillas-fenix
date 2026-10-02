import React, { useEffect, useState } from 'react'
import { fetchBucketUsage } from '../api'

function formatMb(bytes) {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.round(mb * 1024)} KB`
}

export default function BucketView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try { setData(await fetchBucketUsage()) }
    catch (e) { setError(e.message || 'No se pudo cargar el uso del bucket.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6 fade-in">
      <div>
        <div className="page-title">Gestión de bucket</div>
        <div className="page-subtitle">Uso de almacenamiento de historias clínicas por IPS.</div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>
      )}

      {loading && !data && <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Almacenamiento total</div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatMb(data.total_bytes)}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>de {data.tope_mb || 100} MB por IPS</div>
            </div>
            <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>IPS con historias</div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.ips.length}</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>IPS</th>
                  <th className="text-center">Historias</th>
                  <th className="text-right">Uso</th>
                  <th style={{ width: '32%' }}>{`Uso del tope (${data.tope_mb || 100} MB)`}</th>
                </tr>
              </thead>
              <tbody>
                {data.ips.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                      Aún no hay historias clínicas registradas.
                    </td>
                  </tr>
                )}
                {data.ips.map((row) => {
                  const topeBytes = (data.tope_mb || 100) * 1024 * 1024
                  const pct = topeBytes > 0 ? (row.bytes / topeBytes) * 100 : 0
                  return (
                    <tr key={row.ips}>
                      <td><div className="font-medium">{row.ips}</div></td>
                      <td className="text-center">{row.count}</td>
                      <td className="text-right whitespace-nowrap">{formatMb(row.bytes)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-subtle)' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct >= 80 ? 'var(--accent-500)' : 'var(--green-500)' }} />
                          </div>
                          <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{pct.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}