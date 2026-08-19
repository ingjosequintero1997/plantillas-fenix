import React, { useEffect, useMemo, useState } from 'react'
import * as pako from 'pako'
import { fetchCargues, fetchCargue, CARGUE_TXT_URL, CARGUE_EXCEL_URL } from '../api'
import FormulasView from './FormulasView'
import AjustesView from './AjustesView'

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
    } catch (e) {
      console.warn('No se pudo descomprimir:', e)
      return ''
    }
  }
  if (data.compressed) {
    return { ...data, corrected_text: decode(data.corrected_text), raw_text: decode(data.raw_text) }
  }
  return data
}

function Stat({ label, value, color }) {
  const dot = { green: 'bg-emerald-500', red: 'bg-red-500', amber: 'bg-amber-500', slate: 'bg-slate-400' }
  return (
    <div className="rounded-xl border border-[var(--line)] dark:border-[#22272F] bg-white dark:bg-[#16191E] px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dot[color]}`} />
        <span className="text-[0.6rem] font-bold text-[rgb(var(--faint))] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-[rgb(var(--ink))] tracking-tight">{value}</div>
    </div>
  )
}

function CargueDetail({ cargue, onBack }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true); setError('')
      try {
        const data = await fetchCargue(cargue.id)
        if (mounted) setDetail(decompress(data))
      } catch (e) {
        if (mounted) setError(e.message || 'Error al cargar el detalle del cargue')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [cargue.id])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--faint))] hover:text-[#1E6B33] dark:hover:text-emerald-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a la lista
        </button>
        <div className="flex items-center gap-2">
          <span className="badge-green">{cargue.mes}</span>
          <span className="text-[0.55rem] text-[rgb(var(--faint))] font-medium uppercase tracking-wider">{(cargue.template_key || '').toUpperCase()}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl bg-white/80 dark:bg-[#16191E]/80 border border-[var(--line)] dark:border-[#22272F] p-8 text-center">
          <svg className="w-8 h-8 text-[#1E6B33] dark:text-emerald-300 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-[rgb(var(--muted))]">Cargando resultado de la validación…</p>
        </div>
      )}

      {!loading && !error && detail && (
        <>
          <div>
            <h2 className="text-lg font-extrabold text-[rgb(var(--ink))] tracking-tight">{cargue.original_filename}</h2>
            <p className="text-xs text-[rgb(var(--faint))] mt-1">
              {cargue.prestador ? `${cargue.prestador} · ` : ''}Validado el {new Date(cargue.created_at).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Registros" value={detail.row_count ?? 0} color="slate" />
            <Stat label="Errores" value={detail.errors_count ?? 0} color="red" />
            <Stat label="Corregidos" value={detail.corrected_count ?? 0} color="amber" />
            <Stat label="Calidad" value={`${detail.quality_percent ?? 0}%`} color="green" />
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123F20] via-[#175528] to-[#1E6B33] shadow-[0_16px_40px_rgba(18,63,32,0.30)] p-6 md:p-8 text-center">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 mb-4 ring-1 ring-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[0.5rem] font-bold text-white/90 tracking-[0.15em] uppercase">Data lista</span>
              </div>
              <h3 className="text-white text-xl md:text-2xl font-extrabold tracking-tight mb-2">Descarga esta data ajustada</h3>
              <p className="text-white/75 text-sm max-w-lg mx-auto mb-6 font-normal">
                El Excel trae los datos corregidos y las fórmulas de cálculo aplicadas. También puedes descargar el TXT generado.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a href={CARGUE_EXCEL_URL(cargue.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#175528] hover:bg-emerald-50 px-6 py-3 text-sm font-extrabold shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  DATA AJUSTADA (EXCEL)
                </a>
                <a href={CARGUE_TXT_URL(cargue.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 text-white hover:bg-white/25 px-6 py-3 text-sm font-bold ring-1 ring-white/25 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  TXT
                </a>
              </div>
            </div>
          </div>

          <FormulasView />

          <AjustesView logs={Array.isArray(detail.logs_sample) ? detail.logs_sample : []} />
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
  const [mesFilter, setMesFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchCargues(templateKey)
        setRecords(data)
      } catch (e) {
        setError(e.message || 'Error al cargar el historial')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const meses = useMemo(() => {
    const set = new Set(records.map((r) => r.mes).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [records])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((r) => {
      if (mesFilter !== 'all' && r.mes !== mesFilter) return false
      if (!q) return true
      return `${r.original_filename} ${r.prestador ?? ''} ${r.template_key ?? ''} ${r.mes}`.toLowerCase().includes(q)
    })
  }, [records, query, mesFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (selected) {
    return <CargueDetail cargue={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[rgb(var(--ink))] tracking-tight">Verificar data</h2>
          <p className="text-xs text-[rgb(var(--faint))] mt-1">Cargues mensuales de los prestadores — haz clic en una fila para ver su resultado</p>
        </div>
        <button onClick={() => onNavigate('subir')} className="btn-primary">
          Nuevo cargue
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {records.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] dark:border-[#333A45] bg-white/60 dark:bg-[#16191E]/60 p-12 text-center">
          <h3 className="text-sm font-bold text-[rgb(var(--ink))] mb-1">Aún no hay cargues</h3>
          <p className="text-xs text-[rgb(var(--faint))] max-w-md mx-auto">Cuando subas y valides tu primer archivo mensual, aparecerá aquí con su resumen de calidad.</p>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--faint))] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Buscar por archivo, prestador o plantilla…" className="input pl-9" />
            </div>
            <select value={mesFilter} onChange={(e) => { setMesFilter(e.target.value); setPage(1) }} className="select md:w-44">
              <option value="all">Todos los meses</option>
              {meses.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="text-xs text-[rgb(var(--faint))] md:ml-auto">{filtered.length} data{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] dark:border-[#22272F] bg-white dark:bg-[#16191E]">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-[#1C2026] border-b border-[var(--line)] dark:border-[#22272F] text-left">
                    <th className="px-4 py-3 text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Fecha</th>
                    <th className="px-4 py-3 text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Archivo</th>
                    <th className="px-4 py-3 text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Prestador</th>
                    <th className="px-4 py-3 text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Mes</th>
                    <th className="px-4 py-3 text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Plantilla</th>
                    <th className="px-4 py-3 text-center text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Registros</th>
                    <th className="px-4 py-3 text-center text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Errores</th>
                    <th className="px-4 py-3 text-center text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Calidad</th>
                    <th className="px-4 py-3 text-right text-[0.6rem] font-bold uppercase tracking-wider text-[rgb(var(--faint))]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r) => (
                    <tr key={r.id} onClick={() => setSelected(r)}
                      className="border-b border-[var(--line)]/60 dark:border-[#22272F]/70 last:border-0 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-[rgb(var(--faint))]">{new Date(r.created_at).toLocaleDateString('es-CO')}</td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-[#1E6B33] dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </span>
                          <span className="text-sm font-semibold text-[rgb(var(--ink))] truncate max-w-[220px]">{r.original_filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-[rgb(var(--muted))]">{r.prestador || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="badge-green">{r.mes}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-[rgb(var(--muted))] uppercase">{(r.template_key || '').toUpperCase()}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-[rgb(var(--ink))]">{r.row_count ?? 0}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-red-500">{r.errors_count ?? 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.55rem] font-bold border ${
                          (r.quality_percent ?? 0) >= 95
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40'
                            : (r.quality_percent ?? 0) >= 80
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-700/40'
                        }`}>
                          {r.quality_percent ?? 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-[#1E6B33] dark:text-emerald-300 uppercase tracking-wider">
                          Ver <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageItems.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-[rgb(var(--faint))]">Sin resultados para este filtro.</div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--line)]/60 dark:border-[#22272F]">
                <span className="text-xs text-[rgb(var(--faint))]">Página {safePage} de {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}
                    className="w-8 h-8 rounded-lg border border-[var(--line)] dark:border-[#2A303A] flex items-center justify-center text-[rgb(var(--faint))] hover:text-[rgb(var(--ink))] hover:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}
                    className="w-8 h-8 rounded-lg border border-[var(--line)] dark:border-[#2A303A] flex items-center justify-center text-[rgb(var(--faint))] hover:text-[rgb(var(--ink))] hover:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}