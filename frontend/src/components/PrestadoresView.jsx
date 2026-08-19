import React, { useEffect, useState } from 'react'
import { fetchPrestadores, createPrestador } from '../api'

export default function PrestadoresView() {
  const [prestadores, setPrestadores] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '', nit: '', municipio: '',
    username: '', password: '',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setPrestadores(await fetchPrestadores())
      } catch (e) {
        setError(e.message || 'No se pudo cargar los prestadores')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggle = () => setShowForm((v) => !v)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await createPrestador(form)
      setForm({ nombre: '', nit: '', municipio: '', username: '', password: '' })
      setShowForm(false)
      setPrestadores(await fetchPrestadores())
    } catch (err) {
      setError(err.message || 'Error al crear el prestador')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-md shadow-brand-900/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight">Prestadores</h2>
            <p className="text-xs text-ink-muted/60 mt-0.5">Usuarios con credenciales para cargues mensuales</p>
          </div>
        </div>
        <button onClick={toggle} className="btn-primary shadow-lg shadow-brand-900/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo prestador
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-6 space-y-5 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-800 dark:bg-brand-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Nuevo prestador</h3>
              <p className="text-xs text-ink-muted/70">Se crearán las credenciales de acceso para el cargue mensual</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-[0.55rem] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Nombre de la institución</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="E.S.E. Hospital ..." />
            </div>
            <div>
              <label className="block text-[0.55rem] font-bold text-ink-muted uppercase tracking-wider mb-1.5">NIT</label>
              <input name="nit" value={form.nit} onChange={handleChange} className="input" placeholder="800.000.000-0" />
            </div>
            <div>
              <label className="block text-[0.55rem] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Municipio</label>
              <input name="municipio" value={form.municipio} onChange={handleChange} className="input" placeholder="Albania" />
            </div>
            <div>
              <label className="block text-[0.55rem] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Usuario</label>
              <input name="username" value={form.username} onChange={handleChange} required className="input" placeholder="usuario_prestador" />
            </div>
            <div>
              <label className="block text-[0.55rem] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Contraseña</label>
              <input name="password" value={form.password} onChange={handleChange} required type="password" className="input" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button type="button" onClick={toggle} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear prestador</button>
          </div>
        </form>
      )}

      {prestadores.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-ink-line/70 dark:border-[#555558] bg-white/60 dark:bg-[#28282B]/60 p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-brand-600 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-ink mb-1">Sin prestadores registrados</h3>
          <p className="text-xs text-ink-muted/70 max-w-md mx-auto">Crea el primer prestador para habilitar sus credenciales de acceso y sus cargues mensuales.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {prestadores.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                  {(p.nombre || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink truncate">{p.nombre}</div>
                  <div className="text-[0.5rem] text-ink-faint uppercase tracking-wider">{p.municipio || '—'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.45rem] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 border border-brand-200/50 dark:border-brand-700/40">
                  {p.username}
                </span>
                <span className="text-[0.45rem] text-ink-faint font-semibold uppercase tracking-wider">{p.cargues_count ?? 0} cargues</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
