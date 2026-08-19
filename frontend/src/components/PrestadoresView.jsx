import React, { useEffect, useMemo, useState } from 'react'
import { fetchPrestadores, createPrestador } from '../api'

const TEMPLATE_LABELS = { gestante: 'Gestante', citologia: 'Citología', mamografia: 'Mamografía', penta: 'Penta' }
const PER_PAGE = 10

function EmptyState({ onNew }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />
        </svg>
      </div>
      <div className="empty-title">Sin prestadores registrados</div>
      <div className="empty-desc">Agrega el primer prestador para comenzar a recibir sus cargas mensuales.</div>
      <button onClick={onNew} className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Nuevo prestador
      </button>
    </div>
  )
}

function NewPrestadorForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', nit: '', municipio: '', template_key: 'gestante', username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setSaving(true); setError('')
    try {
      await createPrestador(form)
      onCreated()
    } catch (err) {
      setError(err.message || 'No fue posible crear el prestador.')
    } finally {
      setSaving(false)
    }
  }

  const SectionTitle = ({ children }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
      <span className="section-label" style={{ color: 'var(--text)' }}>{children}</span>
    </div>
  )

  const Field = ({ label, children, hint }) => (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="text-[0.68rem] mt-1" style={{ color: 'var(--text-secondary)' }}>{hint}</p>}
    </div>
  )

  return (
    <div className="panel fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Nuevo prestador</div>
            <div className="page-subtitle">Se crearán las credenciales de acceso para el cargue mensual.</div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

          {/* Información del prestador */}
          <div>
            <SectionTitle>Información del prestador</SectionTitle>
            <div className="space-y-3">
              <Field label="Nombre de la institución *">
                <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="E.S.E. Hospital San José" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="NIT / identificación">
                  <input name="nit" value={form.nit} onChange={handleChange} className="input" placeholder="800.000.000-0" />
                </Field>
                <Field label="Municipio">
                  <input name="municipio" value={form.municipio} onChange={handleChange} className="input" placeholder="Albania" />
                </Field>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Usuario de acceso */}
          <div>
            <SectionTitle>Usuario de acceso</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre de usuario *" hint="Con el que iniciará sesión">
                <input name="username" value={form.username} onChange={handleChange} required className="input" placeholder="usuario_hospital" autoComplete="off" />
              </Field>
              <Field label="Contraseña *" hint="Mínimo 6 caracteres">
                <div className="relative">
                  <input name="password" value={form.password} onChange={handleChange} required type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          <div className="divider" />

          {/* Configuración */}
          <div>
            <SectionTitle>Configuración</SectionTitle>
            <Field label="Plantilla asignada" hint="El prestador solo tendrá acceso a esta plantilla">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'gestante', label: 'Gestante', desc: 'Control prenatal' },
                  { key: 'citologia', label: 'Citología', desc: 'Cáncer cervicouterino' },
                  { key: 'mamografia', label: 'Mamografía', desc: 'Cáncer de mama' },
                  { key: 'penta', label: 'Penta', desc: 'Vacunación' },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setForm((f) => ({ ...f, template_key: t.key }))}
                    className="text-left px-3 py-2.5 rounded-lg border transition-colors"
                    style={{
                      borderColor: form.template_key === t.key ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: form.template_key === t.key ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: form.template_key === t.key ? 'var(--primary)' : 'var(--text)' }}>
                      {t.label}
                      {form.template_key === t.key && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                    <div className="text-[0.68rem]" style={{ color: 'var(--text-secondary)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Creando...
                </>
              ) : 'Crear prestador'}
            </button>
          </div>
        </form>
    </div>
  )
}

export default function PrestadoresView() {
  const [prestadores, setPrestadores] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'nombre', dir: 1 })
  const [page, setPage] = useState(1)
  const [menuOpen, setMenuOpen] = useState(null)

  const load = async () => {
    setLoading(true)
    try { setPrestadores(await fetchPrestadores()) }
    catch (e) { setError(e.message || 'No se pudo cargar los prestadores.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = prestadores.filter((p) => !q || `${p.nombre} ${p.municipio} ${p.username}`.toLowerCase().includes(q))
    list = list.sort((a, b) => {
      const va = (a[sort.key] || '').toString().toLowerCase()
      const vb = (b[sort.key] || '').toString().toLowerCase()
      return va < vb ? -sort.dir : va > vb ? sort.dir : 0
    })
    return list
  }, [prestadores, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const toggleSort = (key) => {
    setSort((s) => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 })
    setPage(1)
  }

  // Vista de formulario (en lugar de modal)
  if (showForm) {
    return (
      <NewPrestadorForm
        onClose={() => setShowForm(false)}
        onCreated={() => { setShowForm(false); load() }}
      />
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title">Prestadores</div>
          <div className="page-subtitle">Usuarios con acceso para cargar sus datos mensuales.</div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo prestador
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
      )}

      {prestadores.length === 0 && !loading ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : (
        <>
          {/* Barra de herramientas */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar prestador..." className="input pl-9" />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{filtered.length} prestadores</span>
          </div>

          {/* Tabla */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-gray-700" onClick={() => toggleSort('nombre')}>
                    Prestador {sort.key === 'nombre' ? (sort.dir === 1 ? '↑' : '↓') : ''}
                  </th>
                  <th>Identificación</th>
                  <th>Municipio</th>
                  <th>Plantilla</th>
                  <th className="text-center">Cargas</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="relative">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                          {(p.nombre || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.nit || '—'}</td>
                    <td>{p.municipio || '—'}</td>
                    <td><span className="badge-neutral">{TEMPLATE_LABELS[p.template_key] || p.template_key || '—'}</span></td>
                    <td className="text-center">{p.cargues_count ?? 0}</td>
                    <td className="text-right">
                      <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" /></svg>
                      </button>
                      {menuOpen === p.id && (
                        <div className="absolute right-4 mt-1 z-10 rounded-lg py-1 bg-white shadow-lg border border-gray-100 w-40 text-left">
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver detalle</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Desactivar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Página {safePage} de {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2.5 py-1 text-xs">←</button>
                  <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2.5 py-1 text-xs">→</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}